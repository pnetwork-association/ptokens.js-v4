import { BlockchainType, networkIdToTypeMap, AdapterAddress, ChainId } from 'ptokens-constants'
import { validators } from 'ptokens-helpers'

import { AssetInfo, pTokensAsset } from './ptokens-asset'
import { pTokensAssetProvider } from './ptokens-asset-provider'

export abstract class pTokensAssetBuilder {
  protected _decimals: number
  protected _weight: number
  protected _chainId: ChainId
  protected _assetInfo: AssetInfo
  private _type: BlockchainType
  protected _adapterAddress: string

  /**
   * Create and initialize a pTokensAssetBuilder object.
   * @param _type - A type indicating the builder nature and used for validation.
   */
  constructor(_type: BlockchainType) {
    this._type = _type
  }

  /**
   * Set a weight for the asset during the swap. Its usage is currently not supported.
   * @param _weight - A weight for the token.
   * @returns The same builder. This allows methods chaining.
   */
  setWeight(_weight: number) {
    this._weight = _weight
    return this
  }

  /**
   * Set the blockchain chain ID for the token.
   * @param _chainId - The chain ID.
   * @returns The same builder. This allows methods chaining.
   */
  setBlockchain(_chainId: ChainId) {
    if (networkIdToTypeMap.get(_chainId) !== this._type) throw new Error('Unsupported chain ID')
    this._chainId = _chainId
    return this
  }

  /**
   * Set the number of decimals for the token.
   * @param _decimals - The number of decimals.
   * @returns The same builder. This allows methods chaining.
   */
  setDecimals(_decimals: number) {
    this._decimals = _decimals
    return this
  }

  abstract setProvider(_provider: pTokensAssetProvider): this

  get assetInfo() {
    return this._assetInfo
  }

  setAssetInfo(_assetInfo: AssetInfo) {
    this._assetInfo = _assetInfo
    return this
  }

  /**
   * Return the router address for the swap.
   */
  get adapterAddress(): string {
    return this._adapterAddress || AdapterAddress.get(this._assetInfo.chainId as ChainId)
  }

  /**
   * Set a custom pTokens factory address for the swap.
   * @param _factoryAddress - Address of the pTokens factory contract
   * @returns The same builder. This allows methods chaining.
   */
  setAdapterAddress(_adapterAddress: string) {
    this._adapterAddress = _adapterAddress
    return this
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _build(): Promise<pTokensAsset> {
    throw new Error('_build() is not implemented')
  }

  private validate() {
    if (!this._chainId) throw new Error('Missing chain ID')
    if (!this._assetInfo) throw new Error('Missing asset info')
    if (!this.adapterAddress) throw new Error('Missing adapter address')
    if (!validators.isValidAddressByChainId(this.adapterAddress, this._chainId))
      throw new Error('Invalid factory address')
    if (this._decimals !== undefined) this._assetInfo.decimals = this._decimals
  }

  /**
   * Build a pTokensAsset object from the parameters specified to the builder.
   * @returns A Promise that resolves with the created pTokensAsset object.
   */
  async build(): Promise<pTokensAsset> {
    this.validate()
    return this._build()
  }
}
