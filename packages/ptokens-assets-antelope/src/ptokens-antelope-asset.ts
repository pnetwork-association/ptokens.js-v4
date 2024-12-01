import PromiEvent from "promievent"
import { Chain, chainToProtocolMap, Protocol, Version } from "ptokens-constants"
import { Metadata, Operation, pTokenAssetConfig, pTokensAsset, pTokensAssetProvider, SettleResult, SwapResult } from "ptokens-entities"
import { Name, Session, TransactResult } from "@wharfkit/session"

import { pTokensAntelopeProvider } from './ptokens-antelope-provider'
import { validators } from "ptokens-helpers"
import { getTraceFromTransactionResponse, getOperationFromTrace, getEventPreImage, serializeOperation } from "./lib"
import axios from "axios"

const SWAP_METHOD = 'transfer'
const SETTLE_METHOD = 'settle'

export type pTokenAntelopeAssetConfig = pTokenAssetConfig & {
  /** An pTokensAntelopeProvider for interacting with the underlaying blockchain */
  provider: pTokensAntelopeProvider
}

const isValidAccountName = (accountName: string) => {
  try {
      const name = Name.from(accountName)
      return true
  } catch (_error) {
      return false
  }
}

export class pTokensAntelopeAsset extends pTokensAsset {
  private _provider: pTokensAntelopeProvider

  /**
   * Create and initialize a pTokensEvmAsset object. pTokensEvmAsset objects shall be created with a pTokensEvmAssetBuilder instance.
   */
  constructor(config: pTokenAntelopeAssetConfig) {
    if (!config.assetInfo) throw new Error('Missing assetInfo')
    if (!isValidAccountName(config.assetInfo.nativeTokenAddress))
      throw new Error(`nativeTokenAddress ${config.assetInfo.nativeTokenAddress} must be a valid address`)
    if (!isValidAccountName(config.assetInfo.pTokenAddress))
      throw new Error(`pTokenAddress ${config.assetInfo.pTokenAddress} must be a valid address`)
    if (!config.version) config.version = Version.V1
    if (config.assetInfo.chain.toString() !== config.provider.chainId.toString())
      throw new Error(
        `Provider chainId: ${config.provider.chainId.toString()} do not match with assetInfo chainId: ${parseInt(config.assetInfo.chain)}`,
      )
    if (config.assetInfo.isNative && config.assetInfo.chain !== config.assetInfo.nativeChain)
      throw new Error(
        `Asset is native: its chain: ${config.assetInfo.chain} must match its native asset chain: ${config.assetInfo.nativeChain}`,
      )
    if (!config.assetInfo.isNative && config.assetInfo.chain === config.assetInfo.nativeChain)
      throw new Error(
        `Asset is not native: its chain: ${config.assetInfo.chain} must not match its native asset chain: ${config.assetInfo.nativeChain}`,
      )
    super(config, Protocol.ANTELOPE)
    this._provider = config.provider
  }

  get provider() {
    return this._provider
  }

  /**
   * Set a walletProvider.
   * @param _session - A wharfkit session.
   * @returns The same builder. This allows methods chaining.
   */
  setSession(_session: Session): this {
    this._provider.setSession(_session)
    return this
  }

  getContext(): string {
    const version = this.version.toString(16).padStart(32, '0')
    const protocolId = this.protocol.toString(16).padStart(32, '0')
    const chainId = this.chainId.toString(16).padStart(32, '0')
    return [version, protocolId, chainId].join('')
  }

  public swap(_amount: string, _recipient: string, _destinationChain: Chain, _userData = '0x'): PromiEvent<SwapResult> {
    const promi = new PromiEvent<SwapResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!validators.isValidAddressByChainId(_recipient, chainToProtocolMap.get(_destinationChain) as Protocol))
              return reject(new Error(`${_recipient} is not a valid address for chain ${_destinationChain}`))
            if (!this._provider) return reject(new Error('Missing provider'))

            const sender = await this._provider.getAccount()
            const args = {
              from: sender,
              to: this.adapterAddress,
              quantity: _amount,
              memo: `${sender},${_destinationChain},${_recipient},${_userData}`,
            }
            const txResult: TransactResult = await this._provider
              .transact(
                {
                  actionName: SWAP_METHOD,
                  permission: 'active',
                  contractName: this.adapterAddress
                },
                args,
              )
              .once('txBroadcasted', (_hash: string) => {
                promi.emit('txBroadcasted', { txHash: _hash })
              })
            const trace = getTraceFromTransactionResponse(txResult)
            const blockId = this._provider.blockId(trace.block_num)
            const traceWithBlockId = {block_id: blockId, ...trace}
            const ret = {
              txHash: txResult.response.transaction_id.toString(),
              operation: getOperationFromTrace(traceWithBlockId, this.chainId.toString()),
              preimage: getEventPreImage(traceWithBlockId, this.getContext()),
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

  public async getProofMetadata(_txId: string, _chain: string): Promise<Metadata> {
    try {
      const { data } = await axios.post(
        'https://ec74-35-175-204-96.ngrok-free.app',
        {
          jsonrpc: '2.0',
          method: 'getSignedEvent',
          params: [_chain, _txId],
          id: 1,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      if (!data.signature) throw new Error('Data has been retrieved but no signature is available')
      return { signature: data.signature as object }
    } catch (_err) {
      throw _err
    }
  }

  settle<T = any>(_originChain: Chain, _signature: string, _swapLog?: T, _preimage?: string, _operation?: Operation): PromiEvent<any> {
    if (!_swapLog || !(_preimage &&  _operation)) throw new Error('At least one between swapLog or operation and preimage must be provided')
    const promi = new PromiEvent<SettleResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._provider) return reject(new Error('Missing provider'))
            const operation = _operation ? _operation : getOperationFromTrace(_swapLog, _originChain)
            const preimage = _preimage ? _preimage : getEventPreImage(_swapLog, this.getContext())
            const args = [serializeOperation(operation), [preimage, _signature]]
            const txResult: TransactResult = await this._provider
              .transact(
                {
                  actionName: SETTLE_METHOD,
                  permission: 'active',
                  contractName: this.adapterAddress
                },
                args,
              )
              .once('txBroadcasted', (_hash: string) => {
                promi.emit('txBroadcasted', { txHash: _hash })
              })
            const ret = {
              txHash: txResult.response.transaction_id.toString(),
              eventId: ''
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