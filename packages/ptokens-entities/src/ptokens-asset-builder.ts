import { Chain, Protocol, Version } from 'ptokens-constants'
import { validators } from 'ptokens-helpers'

import { AssetInfo } from './lib'
import { pTokensAsset } from './ptokens-asset'
import { pTokensAssetProvider } from './ptokens-asset-provider'

export type pTokensAssetBuilderParams = {
  provider: pTokensAssetProvider
  assetNativeChain: Chain
}

export abstract class pTokensAssetBuilder {
  protected _assetInfo: AssetInfo
  protected _adapterAddress: string
  protected _version: Version
  protected _protocol: Protocol

  /**
   * Create and initialize a pTokensAssetBuilder object.
   * @param _protocol - A type indicating the builder nature and used for validation.
   */
  constructor(_protocol: Protocol) {
    this._protocol = _protocol
  }

  /**
   * Set the version for the token.
   * @param _version - The token version.
   * @returns The same builder. This allows methods chaining.
   */
  setVersion(_version: Version) {
    this._version = _version
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
    if (!this._protocol) throw new Error('Missing protocol')
    if (!this._adapterAddress) throw new Error('Adapter address for not provided')
    if (!this._version) throw new Error('Missing version')
    if (!validators.isValidAddressByChainId(this._adapterAddress, this._protocol))
      throw new Error('Invalid adapter address')
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
