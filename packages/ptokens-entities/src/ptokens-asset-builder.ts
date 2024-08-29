import { BlockchainType, Protocol, Version } from 'ptokens-constants'
import { validators, getters } from 'ptokens-helpers'

import { AssetInfo } from './lib'
import { pTokensAsset } from './ptokens-asset'
import { pTokensAssetProvider } from './ptokens-asset-provider'

export abstract class pTokensAssetBuilder {
  protected _decimals: number
  protected _chainId: number
  protected _assetInfo: AssetInfo
  private _type: BlockchainType
  protected _adapterAddress: string
  protected _version: Version
  protected _protocolId: Protocol

  /**
   * Create and initialize a pTokensAssetBuilder object.
   * @param _type - A type indicating the builder nature and used for validation.
   */
  constructor(_type: BlockchainType) {
    this._type = _type
  }

  /**
   * Set the blockchain chain ID for the token.
   * @param _chainId - The chain ID.
   * @returns The same builder. This allows methods chaining.
   */
  setChainId(_chainId: number) {
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

  /**
   * Set the version for the token.
   * @param _version - The token version.
   * @returns The same builder. This allows methods chaining.
   */
  setVersion(_version: Version) {
    this._version = _version
    return this
  }

  /**
   * Set the protocolId for the token.
   * @param _protocolId - The token protocolId.
   * @returns The same builder. This allows methods chaining.
   */
  setProtocolId(_protocolId: Protocol) {
    this._protocolId = _protocolId
    return this
  }

  setAssetInfo(_assetInfo: AssetInfo) {
    this._assetInfo = _assetInfo
    return this
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
    if (!this._adapterAddress) {
      const adapterAddress = getters.getAdapterAddress(this._chainId)
      if (!adapterAddress)
        throw new Error(`Adapter address for ${this._chainId} has not been found. Is this chain supported?`)
      this._adapterAddress = adapterAddress
    }
    if (!this._version) throw new Error('Missing version')
    if (!this._protocolId) throw new Error('Missing protocol ID')
    if (!validators.isValidAddressByChainId(this._adapterAddress, this._type))
      throw new Error('Invalid adapter address')
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
