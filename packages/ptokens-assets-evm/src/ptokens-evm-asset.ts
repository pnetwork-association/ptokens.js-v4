import axios from 'axios'
import PromiEvent from 'promievent'
import { BlockchainType, Protocol, Version } from 'ptokens-constants'
import { pTokensAsset, pTokenAssetConfig, SwapResult, SettleResult, Metadata, Operation } from 'ptokens-entities'
import { concat, Log, numberToHex, TransactionReceipt, WalletClient } from 'viem'

import PNetworkAdapterAbi from './abi/PNetworkAdapterAbi'
import {
  getEventIdFromSwapLog,
  getOperationFromLog,
  getLogFromTransactionReceipt,
  serializeOperation,
  decodeAdapterLog,
  isSettleLog,
  getEventPreImage,
} from './lib'
import { pTokensEvmProvider } from './ptokens-evm-provider'

const SWAP_METHOD = 'swap'
const SETTLE_METHOD = 'settle'

export type pTokenEvmAssetConfig = pTokenAssetConfig & {
  /** An pTokensEvmProvider for interacting with the underlaying blockchain */
  provider: pTokensEvmProvider
}

export class pTokensEvmAsset extends pTokensAsset {
  private _provider: pTokensEvmProvider

  /**
   * Create and initialize a pTokensEvmAsset object. pTokensEvmAsset objects shall be created with a pTokensEvmAssetBuilder instance.
   */
  constructor(config: pTokenEvmAssetConfig) {
    if (!config.assetInfo.decimals) throw new Error('Missing decimals')
    if (!config.version) config.version = Version.V1
    if (!config.protocolId) config.protocolId = Protocol.EVM
    if (config.assetInfo.chainId !== config.provider.chainId)
      throw new Error(
        `Provider chainId: ${config.provider.chainId} do not match with assetInfo chainId: ${config.assetInfo.chainId}`,
      )
    super(config, BlockchainType.EVM)
    this._provider = config.provider
  }

  get provider() {
    return this._provider
  }

  /**
   * Set a walletProvider.
   * @param _walletClient - A viem walletClient.
   * @returns The same builder. This allows methods chaining.
   */
  setWalletClient(_walletClient: WalletClient): this {
    this._provider.setWalletClient(_walletClient)
    return this
  }

  getContext(): `0x${string}` {
    const version = numberToHex(this.version, { size: 1 })
    const protocolId = numberToHex(this.protocolId, { size: 1 })
    const chainId = numberToHex(this.chainId, { size: 32 })
    return concat([version, protocolId, chainId])
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  protected swap(
    _amount: bigint,
    _recipient: string,
    _destinationChainId: string,
    _fees = BigInt(0),
    _userData = '0x',
  ): PromiEvent<SwapResult> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    const promi = new PromiEvent<SwapResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._provider) return reject(new Error('Missing provider'))
            const args = [
              this.assetAddress,
              _amount,
              _destinationChainId,
              _recipient, // destinationAccount
              _userData,
            ]
            const txReceipt: TransactionReceipt = await this._provider
              .makeContractSend(
                {
                  method: SWAP_METHOD,
                  abi: PNetworkAdapterAbi,
                  contractAddress: this.adapterAddress,
                  value: 0n,
                },
                args,
              )
              .once('txBroadcasted', (_hash: string) => {
                promi.emit('txBroadcasted', { txHash: _hash })
              })
            const swapLog = getLogFromTransactionReceipt(txReceipt)
            const ret = {
              txHash: txReceipt.transactionHash.toString(),
              operation: getOperationFromLog(swapLog, this.chainId),
              eventId: getEventIdFromSwapLog(swapLog, this.getContext()),
            }
            promi.emit('txConfirmed', ret)
            return resolve(ret)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }

  public async getProofMetadata(_eventId: string): Promise<Metadata> {
    try {
      const { data } = await axios.post(
        'https://pnetwork-node-4a.eu.ngrok.io',
        {
          jsonrpc: '2.0',
          method: 'getSignedEvent',
          params: [_eventId],
          id: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      if (!data.signature) throw new Error('Data has been retrieved but no signature is available')
      return { signature: data.signature as string }
    } catch (_err) {
      throw _err
    }
  }

  public settle<T = Log>(_operation: Operation, _swapLog: T, _metadata: Metadata): PromiEvent<any> {
    const promi = new PromiEvent<SettleResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._provider) return reject(new Error('Missing provider'))
            const preimage = getEventPreImage(_swapLog as Log, this.getContext())
            const args = [serializeOperation(_operation), [preimage, _metadata.signature]]
            const txReceipt: TransactionReceipt = await this._provider
              .makeContractSend(
                {
                  method: SETTLE_METHOD,
                  abi: PNetworkAdapterAbi,
                  contractAddress: this.adapterAddress,
                  value: 0n,
                },
                args,
              )
              .once('txBroadcasted', (_hash: string) => {
                promi.emit('txBroadcasted', { txHash: _hash })
              })
            const settleLog = getLogFromTransactionReceipt(txReceipt)
            const decodedLogArgs = decodeAdapterLog(settleLog)
            if (!isSettleLog(decodedLogArgs)) throw new Error('Invalid settle event log format')
            const ret = {
              txHash: txReceipt.transactionHash.toString(),
              eventId: decodedLogArgs.eventId,
            }
            promi.emit('txConfirmed', ret)
            return resolve(ret)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }
}
