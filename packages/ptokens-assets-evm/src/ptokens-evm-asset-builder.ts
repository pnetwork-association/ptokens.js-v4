import { BlockchainType } from 'ptokens-constants'
import { pTokensAssetBuilder } from 'ptokens-entities'

import factoryAbi from './abi/PFactoryAbi'
import { pTokensEvmAsset } from './ptokens-evm-asset'
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
    const hubAddress = await this._provider.makeContractCall<string, []>({
      contractAddress: this.factoryAddress,
      method: 'hub',
      abi: factoryAbi,
    })

    const pTokenAddress = await this._provider.makeContractCall<string, [string, string, number, string, string]>(
      {
        contractAddress: this.factoryAddress,
        method: 'getPTokenAddress',
        abi: factoryAbi,
      },
      [
        this.assetInfo.underlyingAssetName,
        this.assetInfo.underlyingAssetSymbol,
        this.assetInfo.underlyingAssetDecimals,
        this.assetInfo.underlyingAssetTokenAddress,
        this.assetInfo.underlyingAssetNetworkId,
      ],
    )
    if (!this.assetInfo.assetTokenAddress) this.assetInfo.assetTokenAddress = pTokenAddress
    // else if (pTokenAddress !== this.assetInfo.assetTokenAddress) throw new Error('Invalid pToken address')

    const config = {
      networkId: this._networkId,
      blockchain: this._blockchain,
      network: this._network,
      assetInfo: this.assetInfo,
      provider: this._provider,
      factoryAddress: this.factoryAddress,
      hubAddress: hubAddress,
      pTokenAddress: pTokenAddress,
    }
    return new pTokensEvmAsset(config)
  }
}
