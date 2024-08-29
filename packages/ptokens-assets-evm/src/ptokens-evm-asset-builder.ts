import { BlockchainType } from 'ptokens-constants'
import { pTokensAssetBuilder } from 'ptokens-entities'
import { getters } from 'ptokens-helpers'
import { isAddress } from 'viem'

import { pTokenEvmAssetConfig, pTokensEvmAsset } from './ptokens-evm-asset'
import { pTokensEvmProvider } from './ptokens-evm-provider'

export class pTokensEvmAssetBuilder extends pTokensAssetBuilder {
  private _provider: pTokensEvmProvider

  constructor(_provider: pTokensEvmProvider) {
    super(BlockchainType.EVM)
    this._provider = _provider
  }

  /**
   * Set a pTokensEvmProvider for creating and sending transactions.
   * @param _provider - A pTokensEvmProvider object.
   * @returns The same builder. This allows methods chaining.
   */
  setProvider(_provider: pTokensEvmProvider): this {
    this._provider = _provider
    return this
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _build(): Promise<pTokensEvmAsset> {
    this._chainId = this._provider.chainId
    const adapterAddress = getters.getAdapterAddress(this._chainId)
    if (!adapterAddress) throw new Error(`Adapter not found for ${this._chainId}. Is this chain supported?`)
    this._adapterAddress = adapterAddress
    const pTokenAddress = this._assetInfo.pTokenAddress
    if (pTokenAddress && !isAddress(pTokenAddress))
      throw new Error(`pTokenAddress ${pTokenAddress} must be a valid address`)

    const config: pTokenEvmAssetConfig = {
      assetInfo: this._assetInfo,
      provider: this._provider,
      adapterAddress: this._adapterAddress,
      protocolId: this._protocolId,
      version: this._version,
    }

    return new pTokensEvmAsset(config)
  }
}
