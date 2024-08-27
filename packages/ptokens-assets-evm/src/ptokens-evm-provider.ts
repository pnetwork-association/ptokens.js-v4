import PromiEvent from 'promievent'
import { pTokensAssetProvider } from 'ptokens-entities'
import { stringUtils, getters } from 'ptokens-helpers'
import {
  Abi,
  PublicClient,
  WalletClient,
  TransactionReceipt,
  Log,
  Block,
  http,
  createWalletClient,
  AbiEvent,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import PNetworkAdapterAbi from './abi/PNetworkAdapterAbi'
import { EVENT_NAMES } from './lib/'

export type MakeContractSendOptions = {
  /** The method to be called. */
  method: string
  /** The contract ABI. */
  abi: Abi
  /** The contract address. */
  contractAddress: string
  /** The value being sent with the transaction. */
  value: bigint | string
  /** The gas limit for the transaction. */
  gasLimit?: bigint | string
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

export type GetEvents = {
  fromAddress: `0x${string}`
  contractAddress: `0x${string}`
  contractAbi: Abi
  eventName: EVENT_NAMES
  fromBlock: bigint
  toBlock: bigint
  onLog: (log: Log) => void
  chunkSize?: bigint
}

export class pTokensEvmProvider implements pTokensAssetProvider {
  private _publicClient: PublicClient
  private _walletClient: WalletClient
  private _gasPrice: bigint | undefined
  private _gasLimit: bigint | undefined
  private _chainId: number

  /**
   * Create and initialize a pTokensEvmProvider object.
   * @param _publicClient - A viem public client.
   * @param _walletClient - A viem wallet client.
   */
  constructor(_publicClient: PublicClient, _walletClient?: WalletClient) {
    if (!_publicClient.chain) throw new Error(`No chain in specified publicClient: ${_publicClient}`)
    this._publicClient = _publicClient
    this._chainId = _publicClient.chain.id
    if (_walletClient) this._walletClient = _walletClient
  }

  /**
   * Return the gasPrice set with _setGasPrice()_.
   */
  get gasPrice() {
    return this._gasPrice
  }

  /**
   * Return the gasPrice set with _setGasPrice()_.
   */
  get chainId() {
    return this._chainId
  }

  /**
   * Set transactions gas price.
   * @param _gasPrice - The desired gas price to be used when sending transactions.
   * @returns The same provider. This allows methods chaining.
   */
  setGasPrice(_gasPrice: bigint | number | string) {
    if (BigInt(_gasPrice) <= 0 || BigInt(_gasPrice) >= 1e12) {
      throw new Error('Invalid gas price')
    }
    this._gasPrice = BigInt(_gasPrice)
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
  setGasLimit(_gasLimit: bigint | number | string) {
    if (BigInt(_gasLimit) <= 0 || BigInt(_gasLimit) >= 10e6) {
      throw new Error('Invalid gas limit')
    }
    this._gasLimit = BigInt(_gasLimit)
    return this
  }

  /**
   * Set a private key to sign transactions.
   * @param _key - A private key to sign transactions.
   * @returns The same provider. This allows methods chaining.
   */
  setPrivateKeyWalletClient(_key: `0x${string}`) {
    const pkWalletClient = createWalletClient({
      account: privateKeyToAccount(_key),
      chain: this._publicClient.chain,
      transport: http(),
    })
    this.setWalletClient(pkWalletClient)
    return this
  }

  async getLatestBlockNumber(): Promise<bigint> {
    const block: Block = await this._publicClient.getBlock({ blockTag: 'latest' })
    if (!block.number) throw new Error('Viem could not retreive latest block number')
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
            if (!account) throw new Error('No account found for the provided walletClient')
            const { request } = await this._publicClient.simulateContract({
              account: account,
              address: stringUtils.addHexPrefix(contractAddress),
              abi: abi,
              functionName: method,
              value: BigInt(value),
              args: _args,
              gas: gasLimit ? BigInt(gasLimit) : this.gasLimit,
              gasPrice: this.gasPrice,
            })
            const txHash = await this._walletClient.writeContract(request)
            promi.emit('txBroadcasted', txHash)
            const txReceipt: TransactionReceipt = await this.waitForTransactionConfirmation(txHash, confirmations)
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
   * Wait for tx receipt.
   * @param _txHash - Transcation hash of the searched receipt.
   * @param _confirmations - Number of confirmations to wait.
   * @returns TransactionReceipt of _txHash.
   */
  async waitForTransactionConfirmation(_txHash: string, _confirmations: number = 1): Promise<TransactionReceipt> {
    const receipt: TransactionReceipt = await this._publicClient.waitForTransactionReceipt({
      hash: stringUtils.addHexPrefix(_txHash),
      confirmations: _confirmations,
    })
    if (!receipt) throw new Error('No receipt found')
    return receipt
  }

  async _getEvents(_getEvents: GetEvents): Promise<boolean> {
    return await new Promise<boolean>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!_getEvents.chunkSize) _getEvents.chunkSize = 1000n
            const eventAbi = _getEvents.contractAbi.find(
              (item) => item.type === 'event' && item.name === _getEvents.eventName,
            ) as AbiEvent
            if (!eventAbi) {
              throw new Error(`Event ${_getEvents.eventName} not found in contract ABI`)
            }

            for (
              let endBlock = _getEvents.toBlock;
              endBlock >= _getEvents.fromBlock;
              endBlock -= _getEvents.chunkSize
            ) {
              const startBlock =
                endBlock - _getEvents.chunkSize + 1n > _getEvents.fromBlock
                  ? endBlock - _getEvents.chunkSize + 1n
                  : _getEvents.fromBlock

              // Fetch logs
              const logs = await this._publicClient.getLogs({
                address: _getEvents.contractAddress,
                event: eventAbi,
                args: {
                  from: _getEvents.fromAddress,
                  to: _getEvents.contractAddress,
                },
                fromBlock: startBlock,
                toBlock: endBlock,
              })

              // Process each log
              if (logs) {
              logs.forEach((log) => {
                _getEvents.onLog(log)
              })
              }
            }

            resolve(true)
          } catch (_err) {
            reject(_err)
          }
        })() as unknown,
    )
  }

  getSwaps<T = Log[]>(_from: bigint, _chunkSize = 1000n) {
    const promi = new PromiEvent<T>(
      (resolve, reject) =>
        (async () => {
          try {
            const chainId = this._publicClient.chain?.id as number
            const adapterAddress = getters.getAdapterAddress(chainId)
            if (!adapterAddress) {
              throw new Error(`Adapter address for ${chainId} not found`)
            }
            const [userAddress] = await this._walletClient.getAddresses()
            if (!userAddress) throw new Error('No user account found')

            let res: Log[] = []
            const operation = await this._getEvents({
              fromAddress: userAddress,
              contractAddress: stringUtils.addHexPrefix(adapterAddress),
              contractAbi: PNetworkAdapterAbi,
              eventName: EVENT_NAMES.SWAP,
              fromBlock: _from,
              toBlock: await this._publicClient.getBlockNumber(),
              onLog: (_log: Log) => {
                res.push(_log)
                promi.emit(EVENT_NAMES.SWAP, _log)
              },
              chunkSize: _chunkSize,
            })
            return resolve(res as T)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }
}
