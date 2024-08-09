import PromiEvent from 'promievent'
import { BlockchainType } from 'ptokens-constants'

import { Operation, Metadata, AssetInfo, isNative, isPToken } from './lib'
import { pTokensAssetProvider } from './ptokens-asset-provider'

export type pTokenAssetConfig = {
  /** An AssetInfo object containing asset technical details. */
  assetInfo: AssetInfo
  adapterAddress: string
}

export type NativeToXBasisPoints = {
  /** Basis point fees for native-to-host swap. */
  nativeToHost: number
  /** Basis point fees for native-to-native swap. */
  nativeToNative: number
}

export type HostToXBasisPoints = {
  /** Basis point fees for host-to-host swap. */
  hostToHost: number
  /** Basis point fees for host-to-native swap. */
  hostToNative: number
}

export type AssetFees = {
  /** Fees destinated to pay network fees (expressed in token quantity * 1e18). */
  networkFee: number
  /** Fees destinated to pay network fees (expressed in USD). */
  networkFeeUsd?: number
  /** Minimum fees destinated to node operators (expressed in token quantity * 1e18). */
  minNodeOperatorFee: number
  /** Minimum fees destinated to node operators (expressed in USD). */
  minNodeOperatorFeeUsd?: number
  /** Basis point to calculate node fees destinated to node operators. */
  basisPoints: NativeToXBasisPoints | HostToXBasisPoints
}

export type SwapResult = {
  txHash: string
  operation: Operation
  eventId?: string
}

export type SettleResult = {
  txHash: string
  eventId: string
}

export abstract class pTokensAsset {
  private _adapterAddress: string
  private _assetInfo: AssetInfo
  private _type: BlockchainType
  private _version: number
  private _protocolId: number

  /**
   * Create and initialize a pTokensAsset object. pTokensAsset objects shall be created with a pTokensAssetBuilder instance.
   */
  constructor(_config: pTokenAssetConfig, _type: BlockchainType) {
    if (!_config.assetInfo) throw new Error('Missing asset info')
    if (isPToken(_config.assetInfo))
      if (_config.assetInfo.underlyingAsset.pTokenAddress !== _config.assetInfo.pTokenAddress)
        throw new Error('pToken address does not match underlying asset pToken address')
    this._type = _type
    this._assetInfo = _config.assetInfo
    this._adapterAddress = _config.adapterAddress
  }

  /** Return the pTokensFactory's address. */
  get adapterAddress(): string {
    return this._adapterAddress
  }

  /** Return the token's symbol. */
  get symbol(): string {
    return this.assetInfo.symbol
  }

  /** Return the token's blockchain type. */
  get type(): BlockchainType {
    return this._type
  }

  /** Return the token's protocolId. */
  get protocolId(): number {
    return this._protocolId
  }

  /** Return the token's version. */
  get version(): number {
    return this._version
  }

  /** Return the chain ID of the token. */
  get chainId(): number {
    return this._assetInfo.chainId
  }

  /** Return token smart contract address. */
  get assetAddress(): string {
    if (isNative(this._assetInfo)) return this._assetInfo.tokenAddress
    else return this._assetInfo.pTokenAddress
  }

  /** Return technical details related to the token. */
  get assetInfo(): AssetInfo {
    return this._assetInfo
  }

  /** Return the pTokensAssetProvider eventually assigned */
  abstract get provider(): pTokensAssetProvider

  protected abstract swap(
    _amount: bigint,
    _destinationChainId: string,
    _recipient: string,
    _fees?: bigint,
    _userData?: string,
  ): PromiEvent<SwapResult>

  protected abstract getProofMetadata(_swapTxHash: string, _chainId: number): Promise<Metadata>

  protected abstract settle(_operation: Operation, _metadata: Metadata): PromiEvent<any>
}
