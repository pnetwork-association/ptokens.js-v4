import { BlockchainType } from 'ptokens-constants'
import { pTokensAssetBuilder, isPToken } from 'ptokens-entities'
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
    if (!adapterAddress) throw new Error('Adapter address is required')
    this._adapterAddress = adapterAddress
    const pTokenAddress = this.assetInfo.pTokenAddress
    if (pTokenAddress && !isAddress(pTokenAddress))
      throw new Error(`pTokenAddress ${pTokenAddress} must be a valid address`)
    if (isPToken(this.assetInfo)) {
      if (this.assetInfo.pTokenAddress != this.assetInfo.underlyingAsset.tokenAddress)
        throw new Error(
          `pToken cannot be underlying of itself: ${this.assetInfo.pTokenAddress} must be different from ${this.assetInfo.underlyingAsset.tokenAddress}`,
        )
    }

    const config: pTokenEvmAssetConfig = {
      assetInfo: this.assetInfo,
      provider: this._provider,
      adapterAddress: this.adapterAddress,
    }

    return new pTokensEvmAsset(config)
  }
}
