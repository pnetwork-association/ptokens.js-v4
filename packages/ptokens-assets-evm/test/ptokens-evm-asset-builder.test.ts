import { Chain, Protocol, Version } from 'ptokens-constants'
import { AssetInfo } from 'ptokens-entities'
import { zeroAddress } from 'viem'
import { mainnet } from 'viem/chains'

import { pTokensEvmAssetBuilder, pTokensEvmProvider } from '../src'
import * as utils from '../src/lib'

import { publicClientEthereumMock, walletClientEthereumMock } from './utils/mock-viem-clients'

const adapterAddress = '0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6'
const nativeTokenAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const pTokenAddress = '0x199A551C5B09F08a03536668416778a4C2239148'
const nativeChain = Chain.EthereumMainnet
const chain = Chain.EthereumMainnet
const nativeAssetInfo: AssetInfo = {
  isLocal: true,
  nativeChain: nativeChain,
  chain: chain,
  name: 'token-name',
  symbol: 'token-symbol',
  decimals: 18,
  address: nativeTokenAddress,
  pTokenAddress: pTokenAddress,
  nativeTokenAddress: nativeTokenAddress,
}
const pTokenAssetInfo: AssetInfo = {
  isLocal: false,
  nativeChain: Chain.GnosisMainnet,
  chain: chain,
  name: 'token-name',
  symbol: 'token-symbol',
  decimals: 18,
  address: pTokenAddress,
  pTokenAddress: pTokenAddress,
  nativeTokenAddress: nativeTokenAddress,
}

describe('EVM asset', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('Should create a native EVM asset with provider', async () => {
    const getErc20AddressSpy = jest
      .spyOn(utils, 'getErc20Address')
      .mockReturnValue(new Promise((resolve) => resolve(nativeTokenAddress)))
    const getXerc20AddressSpy = jest
      .spyOn(utils, 'getXerc20Address')
      .mockReturnValue(new Promise((resolve) => resolve(pTokenAddress)))
    const getAssetNameSpy = jest
      .spyOn(utils, 'getAssetName')
      .mockReturnValue(new Promise((resolve) => resolve('token-name')))
    const getAssetSymbolSpy = jest
      .spyOn(utils, 'getAssetSymbol')
      .mockReturnValue(new Promise((resolve) => resolve('token-symbol')))
    const getAssetDecimalsSpy = jest
      .spyOn(utils, 'getAssetDecimals')
      .mockReturnValue(new Promise((resolve) => resolve(18)))
    const isLocalAssetSpy = jest.spyOn(utils, 'isLocalAsset')
    const getLockboxAddressSpy = jest
      .spyOn(utils, 'getLockboxAddress')
      .mockReturnValue(new Promise((resolve) => resolve('0x1B48422412528F4d02F8B4B6c6c8a4334E84A57C')))

    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: nativeChain })
    builder.setAdapterAddress(adapterAddress)
    builder.setVersion(Version.V1)
    const asset = await builder.build()
    expect(getErc20AddressSpy).toHaveBeenCalledTimes(1)
    expect(getErc20AddressSpy).toHaveBeenCalledWith(adapterAddress, provider)
    expect(getXerc20AddressSpy).toHaveBeenCalledTimes(1)
    expect(getXerc20AddressSpy).toHaveBeenCalledWith(adapterAddress, provider)
    expect(getLockboxAddressSpy).toHaveBeenCalledTimes(1)
    expect(getLockboxAddressSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(getAssetNameSpy).toHaveBeenCalledTimes(1)
    expect(getAssetNameSpy).toHaveBeenCalledWith(nativeTokenAddress, provider)
    expect(getAssetSymbolSpy).toHaveBeenCalledTimes(1)
    expect(getAssetSymbolSpy).toHaveBeenCalledWith(nativeTokenAddress, provider)
    expect(getAssetDecimalsSpy).toHaveBeenCalledTimes(1)
    expect(getAssetDecimalsSpy).toHaveBeenCalledWith(nativeTokenAddress, provider)
    expect(isLocalAssetSpy).toHaveBeenCalledTimes(1)
    expect(isLocalAssetSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(asset.adapterAddress).toStrictEqual(adapterAddress)
    expect(asset.protocol).toStrictEqual(Protocol.EVM)
    expect(asset.chainId).toStrictEqual(mainnet.id)
    expect(asset.version).toStrictEqual(Version.V1)
    expect(asset.provider).toStrictEqual(provider)
    expect(asset.assetInfo).toStrictEqual(nativeAssetInfo)
  })

  it('Should create a pToken EVM asset with provider', async () => {
    const getErc20AddressSpy = jest
      .spyOn(utils, 'getErc20Address')
      .mockReturnValue(new Promise((resolve) => resolve(nativeTokenAddress)))
    const getXerc20AddressSpy = jest
      .spyOn(utils, 'getXerc20Address')
      .mockReturnValue(new Promise((resolve) => resolve(pTokenAddress)))
    const getAssetNameSpy = jest
      .spyOn(utils, 'getAssetName')
      .mockReturnValue(new Promise((resolve) => resolve('token-name')))
    const getAssetSymbolSpy = jest
      .spyOn(utils, 'getAssetSymbol')
      .mockReturnValue(new Promise((resolve) => resolve('token-symbol')))
    const getAssetDecimalsSpy = jest
      .spyOn(utils, 'getAssetDecimals')
      .mockReturnValue(new Promise((resolve) => resolve(18)))
    const isLocalAssetSpy = jest.spyOn(utils, 'isLocalAsset')
    const getLockboxAddressSpy = jest
      .spyOn(utils, 'getLockboxAddress')
      .mockReturnValue(new Promise((resolve) => resolve(zeroAddress)))

    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: Chain.GnosisMainnet })
    builder.setAdapterAddress(adapterAddress)
    builder.setVersion(Version.V1)
    const asset = await builder.build()
    expect(getErc20AddressSpy).toHaveBeenCalledTimes(1)
    expect(getErc20AddressSpy).toHaveBeenCalledWith(adapterAddress, provider)
    expect(getXerc20AddressSpy).toHaveBeenCalledTimes(1)
    expect(getXerc20AddressSpy).toHaveBeenCalledWith(adapterAddress, provider)
    expect(getLockboxAddressSpy).toHaveBeenCalledTimes(1)
    expect(getLockboxAddressSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(getAssetNameSpy).toHaveBeenCalledTimes(1)
    expect(getAssetNameSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(getAssetSymbolSpy).toHaveBeenCalledTimes(1)
    expect(getAssetSymbolSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(getAssetDecimalsSpy).toHaveBeenCalledTimes(1)
    expect(getAssetDecimalsSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(isLocalAssetSpy).toHaveBeenCalledTimes(1)
    expect(isLocalAssetSpy).toHaveBeenCalledWith(pTokenAddress, provider)
    expect(asset.adapterAddress).toStrictEqual(adapterAddress)
    expect(asset.protocol).toStrictEqual(Protocol.EVM)
    expect(asset.chainId).toStrictEqual(mainnet.id)
    expect(asset.version).toStrictEqual(Version.V1)
    expect(asset.provider).toStrictEqual(provider)
    expect(asset.assetInfo).toStrictEqual(pTokenAssetInfo)
  })

  it('Should create a EVM asset with provider and assetInfo', async () => {
    const getErc20AddressSpy = jest.spyOn(utils, 'getErc20Address')
    const getXerc20AddressSpy = jest.spyOn(utils, 'getXerc20Address')
    const getLockboxAddressSpy = jest.spyOn(utils, 'getLockboxAddress')
    const getAssetNameSpy = jest.spyOn(utils, 'getAssetName')
    const getAssetSymbolSpy = jest.spyOn(utils, 'getAssetSymbol')
    const getAssetDecimalsSpy = jest.spyOn(utils, 'getAssetDecimals')
    const isLocalAssetSpy = jest.spyOn(utils, 'isLocalAsset')

    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: nativeChain })
    builder.setAdapterAddress(adapterAddress)
    builder.setVersion(Version.V1)
    builder.setAssetInfo(pTokenAssetInfo)
    const asset = await builder.build()
    expect(getErc20AddressSpy).toHaveBeenCalledTimes(0)
    expect(getXerc20AddressSpy).toHaveBeenCalledTimes(0)
    expect(getLockboxAddressSpy).toHaveBeenCalledTimes(0)
    expect(getAssetNameSpy).toHaveBeenCalledTimes(0)
    expect(getAssetSymbolSpy).toHaveBeenCalledTimes(0)
    expect(getAssetDecimalsSpy).toHaveBeenCalledTimes(0)
    expect(isLocalAssetSpy).toHaveBeenCalledTimes(0)
    expect(asset.adapterAddress).toStrictEqual(adapterAddress)
    expect(asset.protocol).toStrictEqual(Protocol.EVM)
    expect(asset.chainId).toStrictEqual(mainnet.id)
    expect(asset.version).toStrictEqual(Version.V1)
    expect(asset.provider).toStrictEqual(provider)
    expect(asset.assetInfo).toStrictEqual(pTokenAssetInfo)
  })

  it('Should create a EVM asset with provider and assetInfo', async () => {
    const assetInfo: AssetInfo = {
      isLocal: false,
      nativeChain: Chain.GnosisMainnet,
      chain: chain,
      name: 'token-name',
      symbol: 'token-symbol',
      decimals: 18,
      address: pTokenAddress,
      pTokenAddress: pTokenAddress,
      nativeTokenAddress: nativeTokenAddress,
    }

    const getErc20AddressSpy = jest.spyOn(utils, 'getErc20Address')
    const getXerc20AddressSpy = jest.spyOn(utils, 'getXerc20Address')
    const getLockboxAddressSpy = jest.spyOn(utils, 'getLockboxAddress')
    const getAssetNameSpy = jest.spyOn(utils, 'getAssetName')
    const getAssetSymbolSpy = jest.spyOn(utils, 'getAssetSymbol')
    const getAssetDecimalsSpy = jest.spyOn(utils, 'getAssetDecimals')
    const isLocalAssetSpy = jest.spyOn(utils, 'isLocalAsset')

    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: Chain.GnosisMainnet })
    builder.setAdapterAddress(adapterAddress)
    builder.setVersion(Version.V1)
    builder.setAssetInfo(assetInfo)
    const asset = await builder.build()
    expect(getErc20AddressSpy).toHaveBeenCalledTimes(0)
    expect(getXerc20AddressSpy).toHaveBeenCalledTimes(0)
    expect(getLockboxAddressSpy).toHaveBeenCalledTimes(0)
    expect(getAssetNameSpy).toHaveBeenCalledTimes(0)
    expect(getAssetSymbolSpy).toHaveBeenCalledTimes(0)
    expect(getAssetDecimalsSpy).toHaveBeenCalledTimes(0)
    expect(isLocalAssetSpy).toHaveBeenCalledTimes(0)
    expect(asset.adapterAddress).toStrictEqual(adapterAddress)
    expect(asset.protocol).toStrictEqual(Protocol.EVM)
    expect(asset.chainId).toStrictEqual(mainnet.id)
    expect(asset.version).toStrictEqual(Version.V1)
    expect(asset.provider).toStrictEqual(provider)
    expect(asset.assetInfo).toStrictEqual(assetInfo)
  })

  it('Should throw if no provider is found', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: nativeChain })
    builder.setAdapterAddress(adapterAddress)
    builder.setVersion(Version.V1)
    builder['_provider'] = undefined as unknown as pTokensEvmProvider
    try {
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Provider not found')
    }
  })
})
