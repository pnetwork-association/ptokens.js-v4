import axios from 'axios'
import PromiEvent from 'promievent'
import { Chain, Protocol, Version, chainToProtocolMap } from 'ptokens-constants'
import { pTokensAsset, pTokenAssetConfig, SwapResult, SettleResult, Metadata } from 'ptokens-entities'
import { validators } from 'ptokens-helpers'
import { concat, isAddress, Log, numberToHex, TransactionReceipt, WalletClient } from 'viem'

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
    if (!config.assetInfo) throw new Error('Missing assetInfo')
    if (!isAddress(config.assetInfo.nativeTokenAddress))
      throw new Error(`nativeTokenAddress ${config.assetInfo.nativeTokenAddress} must be a valid address`)
    if (!isAddress(config.assetInfo.pTokenAddress))
      throw new Error(`pTokenAddress ${config.assetInfo.pTokenAddress} must be a valid address`)
    if (!config.version) config.version = Version.V1
    if (parseInt(config.assetInfo.chain) !== config.provider.chainId)
      throw new Error(
        `Provider chainId: ${config.provider.chainId} do not match with assetInfo chainId: ${parseInt(config.assetInfo.chain)}`,
      )

    super(config, Protocol.EVM)
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
    const protocolId = numberToHex(this.protocol, { size: 1 })
    const chainId = numberToHex(this.chainId, { size: 32 })
    return concat([version, protocolId, chainId])
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  public swap(_amount: bigint, _recipient: string, _destinationChain: Chain, _userData = '0x'): PromiEvent<SwapResult> {
    /* eslint-enable @typescript-eslint/no-unused-vars */
    const promi = new PromiEvent<SwapResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!validators.isValidAddressByChainId(_recipient, chainToProtocolMap.get(_destinationChain) as Protocol))
              return reject(new Error(`${_recipient} is not a valid address for chain ${_destinationChain}`))
            if (!this._provider) return reject(new Error('Missing provider'))
            const args = [this.assetInfo.address, _amount, _destinationChain, _recipient, _userData]
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

  public settle<T = Log>(_swapLog: T, _originChain: Chain, _metadata: Metadata): PromiEvent<any> {
    const promi = new PromiEvent<SettleResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._provider) return reject(new Error('Missing provider'))
            const operation = getOperationFromLog(_swapLog as Log, parseInt(_originChain))
            const preimage = getEventPreImage(_swapLog as Log, this.getContext())
            const args = [serializeOperation(operation), [preimage, _metadata.signature]]
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
