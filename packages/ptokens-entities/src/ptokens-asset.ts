import PromiEvent from 'promievent'
import { Chain, Protocol, Version } from 'ptokens-constants'

import { Operation, Metadata, AssetInfo } from './lib'
import { pTokensAssetProvider } from './ptokens-asset-provider'

export type pTokenAssetConfig = {
  /** An AssetInfo object containing asset technical details. */
  assetInfo: AssetInfo
  adapterAddress: string
  version: Version
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
  private _protocol: Protocol
  private _version: number

  /**
   * Create and initialize a pTokensAsset object. pTokensAsset objects shall be created with a pTokensAssetBuilder instance.
   */
  constructor(_config: pTokenAssetConfig, _protocol: Protocol) {
    if (!_config.assetInfo) throw new Error('Missing asset info')
    if (!_config.version) throw new Error('Missing asset version')
    if (_config.assetInfo.isNative && _config.assetInfo.chain !== _config.assetInfo.nativeChain)
      throw new Error(
        `the asset is native: chain ${_config.assetInfo.chain} and nativeChain ${_config.assetInfo.nativeChain} must be equal`,
      )
    if (!_config.assetInfo.isNative && _config.assetInfo.address !== _config.assetInfo.pTokenAddress)
      throw new Error(
        `the asset is not native: pTokenAddress ${_config.assetInfo.pTokenAddress} and address ${_config.assetInfo.address} must be equal`,
      )
    if (_config.assetInfo.isNative && _config.assetInfo.address !== _config.assetInfo.nativeTokenAddress)
      throw new Error(
        `the asset is native: nativeTokenAddress ${_config.assetInfo.nativeTokenAddress} and address ${_config.assetInfo.address} must be equal`,
      )
    this._version = _config.version
    this._protocol = _protocol
    this._assetInfo = _config.assetInfo
    this._adapterAddress = _config.adapterAddress
  }

  /** Return the pTokensFactory's address. */
  get adapterAddress(): string {
    return this._adapterAddress
  }

  /** Return technical details related to the token. */
  get assetInfo(): AssetInfo {
    return this._assetInfo
  }

  /** Return the token's blockchain protocol. */
  get protocol(): Protocol {
    return this._protocol
  }

  /** Return the token's version. */
  get version(): number {
    return this._version
  }

  /** Return the chain ID of the token. */
  get chainId(): number {
    return parseInt(this._assetInfo.chain)
  }

  /** Return the pTokensAssetProvider eventually assigned */
  abstract get provider(): pTokensAssetProvider

  public abstract swap(
    _amount: bigint,
    _destinationChainId: string,
    _recipient: string,
    _userData?: string,
  ): PromiEvent<SwapResult>

  public abstract getProofMetadata(_eventId: string): Promise<Metadata>

  public abstract settle<T>(_swapLog: T, _originChain: Chain, _metadata: Metadata): PromiEvent<any>
}
