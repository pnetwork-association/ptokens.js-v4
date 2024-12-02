import { Chain, Protocol } from 'ptokens-constants'
import { pTokensAssetBuilder } from 'ptokens-entities'
import { stringUtils, getters } from 'ptokens-helpers'

import { getAssetDecimals, getAssetName, getAssetSymbol, getErc20Address, getXerc20Address, isLocalAsset } from './lib'
import { pTokenEvmAssetConfig, pTokensEvmAsset } from './ptokens-evm-asset'
import { pTokensEvmProvider } from './ptokens-evm-provider'

export type pTokensEvmAssetBuilderParams = {
  provider: pTokensEvmProvider
  assetNativeChain: Chain
}

export class pTokensEvmAssetBuilder extends pTokensAssetBuilder {
  private _provider: pTokensEvmProvider
  private _nativeChain: Chain

  constructor(_buildParams: pTokensEvmAssetBuilderParams) {
    super(Protocol.EVM)
    this._provider = _buildParams.provider
    this._nativeChain = _buildParams.assetNativeChain
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async _build(): Promise<pTokensEvmAsset> {
    if (!this._provider) throw new Error('Provider not found')
    const adapterAddress = stringUtils.addHexPrefix(this._adapterAddress)
    if (!this._assetInfo) {
      const erc20Address = await getErc20Address(adapterAddress, this._provider)
      const xerc20Address = await getXerc20Address(adapterAddress, this._provider)
      const isLocal = await isLocalAsset(xerc20Address, this._provider)
      this.setAssetInfo({
        isLocal: isLocal,
        nativeChain: this._nativeChain,
        chain: getters.getChain(this._provider.chainId),
        name: isLocal
          ? await getAssetName(erc20Address, this._provider)
          : await getAssetName(xerc20Address, this._provider),
        symbol: isLocal
          ? await getAssetSymbol(erc20Address, this._provider)
          : await getAssetSymbol(xerc20Address, this._provider),
        decimals: isLocal
          ? await getAssetDecimals(erc20Address, this._provider)
          : await getAssetDecimals(xerc20Address, this._provider),
        address: isLocal ? erc20Address : xerc20Address,
        pTokenAddress: xerc20Address,
        nativeTokenAddress: erc20Address,
      })
    }

    const config: pTokenEvmAssetConfig = {
      assetInfo: this._assetInfo,
      provider: this._provider,
      adapterAddress: this._adapterAddress,
      version: this._version,
    }

    return new pTokensEvmAsset(config)
  }
}
