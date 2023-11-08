// @ts-ignore
import polling from 'light-async-polling'
import PromiEvent from 'promievent'
import { pTokensAssetProvider } from 'ptokens-entities'
import { stringUtils } from 'ptokens-helpers'
import { Abi, PublicClient, WalletClient, TransactionReceipt, Log, Block } from 'viem'

import pNetworkHubAbi from './abi/PNetworkHubAbi'
import { EVENT_NAMES, getOperationIdFromLog } from './lib/'

const BLOCK_OFFSET = 1000n

export type MakeContractSendOptions = {
  /** The method to be called. */
  method: string
  /** The contract ABI. */
  abi: Abi
  /** The contract address. */
  contractAddress: string
  /** The value being sent with the transaction. */
  value: bigint
  /** The gas limit for the transaction. */
  gasLimit?: bigint
  /** The number of confirmation to wait before returning the tx receipt */
  confirmations?: number
}

export type MakeContractCallOptions = {
  /** The method to be called. */
  method: string
  /** The contract ABI. */
  abi: Abi
  /** The contract address. */
  contractAddress: string
}

export class pTokensEvmProvider implements pTokensAssetProvider {
  private _publicClient: PublicClient
  private _walletClient: WalletClient
  private _gasPrice: bigint | undefined
  private _gasLimit: bigint | undefined

  /**
   * Create and initialize a pTokensEvmProvider object.
   * @param _publicClient - A viem public client.
   * @param _walletClient - A viem wallet client.
   */
  constructor(_publicClient: PublicClient, _walletClient?: WalletClient) {
    this._publicClient = _publicClient
    if (_walletClient) this._walletClient = _walletClient
  }

  /**
   * Return the gasPrice set with _setGasPrice()_.
   */
  get gasPrice() {
    return this._gasPrice
  }

  /**
   * Set transactions gas price.
   * @param _gasPrice - The desired gas price to be used when sending transactions.
   * @returns The same provider. This allows methods chaining.
   */
  setGasPrice(_gasPrice: bigint) {
    if (BigInt(_gasPrice) <= 0n || BigInt(_gasPrice) >= 1e12) {
      throw new Error('Invalid gas price')
    }
    this._gasPrice = _gasPrice
    return this
  }

  /**
   * Set a viem walletCLient creating and sending transactions.
   * @param _walletClient - A viem walletClient.
   * @returns The same builder. This allows methods chaining.
   */
  setWalletClient(_walletClient: WalletClient): this {
    this._walletClient = _walletClient
    return this
  }

  /**
   * Return the gasLimit set with _setGasLimit()_.
   */
  get gasLimit() {
    return this._gasLimit
  }

  /**
   * Set transactions gas limit.
   * @param _gasPrice - The desired gas limit to be used when sending transactions.
   * @returns The same provider. This allows methods chaining.
   */
  setGasLimit(_gasLimit: bigint) {
    if (_gasLimit <= 0 || _gasLimit >= 10e6) {
      throw new Error('Invalid gas limit')
    }
    this._gasLimit = _gasLimit
    return this
  }

  // /**
  //  * Set a private key to sign transactions.
  //  * @param _key - A private key to sign transactions.
  //  * @returns The same provider. This allows methods chaining.
  //  */
  // setPrivateKey(_key: string) {
  //   // TODO
  //   return this
  // }

  async getLatestBlockNumber(): Promise<bigint | null> {
    const block: Block = await this._publicClient.getBlock({ blockTag: 'latest' })
    return block.number
  }

  /**
   * Send a transaction to the smart contract and execute its method.
   * Note this can alter the smart contract state.
   * The function returns a PromiEvent, i.e. a Promise that can also emit events.
   * In particular, the events fired during the execution are the following:
   * * _txBroadcasted_ -\> fired with the transactions hash when the transaction is broadcasted on-chain;
   * * _txConfirmed_ -\> fired with the transactions hash when the transaction is confirmed on-chain;
   * * _txError -\> fired whenever an error occurs during the transaction execution;
   * @param _options - An object specifying the contract interaction.
   * @param _args - The arguments to be passed to the contract method being called.
   * @returns A PromiEvent that resolves with the hash of the resulting transaction.
   */
  makeContractSend<T extends unknown[] = []>(_options: MakeContractSendOptions, _args: T | [] = []) {
    const promi = new PromiEvent<TransactionReceipt>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._walletClient) throw new Error('WalletClient not provided')
            const { method, abi, contractAddress, value, gasLimit, confirmations } = _options
            const [account] = await this._walletClient.getAddresses()
            const { request } = await this._publicClient.simulateContract({
              account: account,
              address: stringUtils.addHexPrefix(contractAddress),
              abi: abi,
              functionName: method,
              value: value,
              args: _args,
              gas: gasLimit || this.gasLimit ? gasLimit || this.gasLimit : undefined,
              gasPrice: this.gasPrice ? this.gasPrice : undefined,
            })
            const txHash = await this._walletClient.writeContract(request)
            promi.emit('txBroadcasted', txHash)
            const txReceipt: TransactionReceipt = await this._publicClient.waitForTransactionReceipt({
              hash: txHash,
              confirmations: confirmations ? confirmations : 1,
            })
            promi.emit('txConfirmed', txReceipt)
            return resolve(txReceipt)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }

  /**
   * Call a “constant” method and execute its smart contract method in the EVM without sending any transaction.
   * Note calling cannot alter the smart contract state.
   * @param _options - An object specifying the contract interaction.
   * @param _args - The arguments to be passed to the contract method being called.
   * @returns A Promise that resolves with the return value(s) of the smart contract method.
   */
  async makeContractCall<R, T extends unknown[] = []>(
    _options: MakeContractCallOptions,
    _args: T | [] = [],
  ): Promise<R> {
    const { method, abi, contractAddress } = _options
    return this._publicClient.readContract({
      address: stringUtils.addHexPrefix(contractAddress),
      abi: abi,
      functionName: method,
      args: _args,
    }) as Promise<R>
  }

  /**
   * @deprecated Use https://viem.sh/docs/actions/public/waitForTransactionReceipt.html instead
   */
  async waitForTransactionConfirmation(_tx: string, _pollingTime = 1000) {
    let receipt: TransactionReceipt | undefined
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await polling(async () => {
      try {
        receipt = await this._publicClient.getTransactionReceipt({ hash: stringUtils.addHexPrefix(_tx) })
        if (!receipt) return false
        else if (receipt.status) return true
        else return false
      } catch (_err) {
        return false
      }
    }, _pollingTime)
    if (!receipt) throw new Error('Polling function stopped unexpectedly. No receipt found')
    return receipt.transactionHash.toString()
  }

  /**
   * Wait for tx receipt.
   * @param _txHash - Transcation hash of the searched receipt.
   * @returns TransactionReceipt of _txHash.
   */
  async waitForTransactionReceipt(_txHash: `0x${string}`): Promise<TransactionReceipt> {
    const receipt: TransactionReceipt = await this._publicClient.waitForTransactionReceipt({ hash: _txHash})
    if (!receipt) throw new Error('No receipt found')
    return receipt
  }

  protected async _pollForHubOperation(
    _hubAddress: string,
    _eventName: EVENT_NAMES,
    _fromBlock: bigint,
    _operationId: string,
    _pollingTime = 1000,
  ): Promise<Log> {
    let log: Log | undefined
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await polling(async () => {
      try {
        log = undefined
        const logs = await this._publicClient.getLogs({
          fromBlock: _fromBlock,
          address: stringUtils.addHexPrefix(_hubAddress),
          events: pNetworkHubAbi.filter((_fun) => _fun.type === 'event' && _fun.name === _eventName.toString()),
        })
        log = logs.find((_log) => getOperationIdFromLog(_log) === _operationId)
        if (log) return true
        return false
      } catch (_err) {
        return false
      }
    }, _pollingTime)
    if (!log) throw new Error('Polling function stopped unexpectedly. No log found')
    return log
  }

  monitorCrossChainOperations(_hubAddress: string, _operationId: string) {
    const promi = new PromiEvent<`0x${string}`>(
      (resolve, reject) =>
        (async () => {
          try {
            const latestBlockNumber = await this.getLatestBlockNumber()
            if (!latestBlockNumber) throw new Error('Viem could not retreive latest block number')
            const fromBlock = latestBlockNumber - BigInt(BLOCK_OFFSET)
            await this._pollForHubOperation(_hubAddress, EVENT_NAMES.OPERATION_QUEUED, fromBlock, _operationId).then(
              (_log) => {
                promi.emit('operationQueued', _log.transactionHash)
                return _log
              },
            )
            const finalTxLog: Log = await Promise.any([
              this._pollForHubOperation(_hubAddress, EVENT_NAMES.OPERATION_EXECUTED, fromBlock, _operationId).then(
                (_log) => {
                  promi.emit('operationExecuted', _log.transactionHash)
                  return _log
                },
              ),
              // TODO: need a way to stop this polling whenever the OPERATION_EXECUTED polling resolves
              // this._pollForStateManagerOperation(
              //   _stateManagerAddress,
              //   EVENT_NAMES.OPERATION_CANCELLED,
              //   fromBlock,
              //   _operationId
              // ).then((_log) => {
              //   promi.emit('operationCancelled', _log.transactionHash)
              //   return _log
              // }),
            ])
            if (!finalTxLog.transactionHash) throw new Error('Tx Log do not contain a transaction hash')
            return resolve(finalTxLog.transactionHash)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }
}
