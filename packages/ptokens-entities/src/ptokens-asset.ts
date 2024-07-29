import PromiEvent from 'promievent'
import { BlockchainType, ChainId, networkIdToTypeMap } from 'ptokens-constants'

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

type pTokenAsset = {
  /** The name of the asset. */
  name: string
  /** The chain ID of the asset's blockchain. */
  chainId: string
  /** Asset symbol */
  symbol: string
  /** pToken address. */
  pTokenAddress: string
  /** Token's decimals. */
  decimals: number
  /** Underlying asset information */
  underlyingAsset: NativeAsset
}

type NativeAsset = {
  /** The name of the asset. */
  name: string
  /** The chain ID of the asset's blockchain. */
  chainId: string
  /** Asset symbol */
  symbol: string
  /** Token smart contract address. */
  tokenAddress: string
  /** Token's decimals. */
  decimals: number
  /** pNetwork address. */
  pTokenAddress: string
}

export type AssetInfo = NativeAsset | pTokenAsset

export type SwapResult = {
  txHash: string
  eventId?: string
}

export abstract class pTokensAsset {
  private _adapterAddress: string
  private _assetInfo: AssetInfo
  private _type: BlockchainType

  /**
   * Create and initialize a pTokensAsset object. pTokensAsset objects shall be created with a pTokensAssetBuilder instance.
   */
  constructor(_config: pTokenAssetConfig, _type: BlockchainType) {
    if (!_config.assetInfo) throw new Error('Missing asset info')
    if (this.isPToken(_config.assetInfo))
      if (_config.assetInfo.underlyingAsset.pTokenAddress !== _config.assetInfo.pTokenAddress)
        throw new Error('pToken address does not match underlying asset pToken address')
    if (networkIdToTypeMap.get(_config.assetInfo.chainId) !== _type) throw new Error('Not supported chain ID')
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

  /** Return the chain ID of the token. */
  get networkId(): ChainId {
    return this._assetInfo.chainId as ChainId
  }

  /** Return token smart contract address. */
  get assetAddress(): string {
    if (this.isNative(this._assetInfo)) return this._assetInfo.tokenAddress
    else return this._assetInfo.pTokenAddress
  }

  /** Return technical details related to the token. */
  get assetInfo(): AssetInfo {
    return this._assetInfo
  }

  /** Return the pTokensAssetProvider eventually assigned */
  abstract get provider(): pTokensAssetProvider

  isNative(assetInfo: AssetInfo): assetInfo is NativeAsset {
    return assetInfo.pTokenAddress === undefined && (assetInfo as pTokenAsset).underlyingAsset === undefined
  }

  isPToken(assetInfo: AssetInfo): assetInfo is pTokenAsset {
    return assetInfo.pTokenAddress === (assetInfo as pTokenAsset).underlyingAsset.pTokenAddress
  }

  protected abstract swap(
    _amount: bigint,
    _recipient: string,
    _destinationChainId: string,
    _fees?: bigint,
    _optionsMask?: string,
    _userData?: string,
  ): PromiEvent<SwapResult>

  protected abstract monitorCrossChainOperations(_operationId: string): PromiEvent<any>
}
