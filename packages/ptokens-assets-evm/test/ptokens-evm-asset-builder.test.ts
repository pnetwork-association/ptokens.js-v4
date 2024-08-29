import { BlockchainType, Protocol, Version } from 'ptokens-constants'
import { AssetInfo, NativeAsset } from 'ptokens-entities'
import { getters } from 'ptokens-helpers'
import { bsc, mainnet, polygon } from 'viem/chains'

import { pTokensEvmAssetBuilder, pTokensEvmProvider } from '../src'

import {
  publicClientEthereumMock,
  walletClientEthereumMock,
  publicClientBscMock,
  walletClientBscMock,
  publicClientPolygonMock,
  walletClientPolygonMock,
} from './utils/mock-viem-clients'

describe('EVM asset', () => {
  beforeAll(() => {
    jest.restoreAllMocks()
  })

  it('Should create a native EVM asset with provider', async () => {
    const assetInfo = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
      pTokenAddress: '0xA15BB66138824a1c7167f5E85b957d04Dd34E468',
    } as AssetInfo
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setChainId(assetInfo.chainId)
    builder.setAssetInfo(assetInfo)
    builder.setProvider(provider)
    builder.setProtocolId(Protocol.EOS)
    builder.setVersion(Version.V2)
    const asset = await builder.build()
    expect(asset.adapterAddress).toStrictEqual(getters.getAdapterAddress(assetInfo.chainId))
    expect(asset.type).toStrictEqual(BlockchainType.EVM)
    expect(asset.assetAddress).toStrictEqual('0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35')
    expect(asset.chainId).toStrictEqual(assetInfo.chainId)
    expect(asset.protocolId).toStrictEqual(Protocol.EOS)
    expect(asset.version).toStrictEqual(Version.V2)
    expect(asset.symbol).toStrictEqual(assetInfo.symbol)
    expect(asset.provider).toEqual(provider)
    expect(asset.assetInfo).toBe(assetInfo)
  })

  it('Should create a pToken EVM asset with provider', async () => {
    const nativeAsset = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
    } as NativeAsset
    const assetInfo = {
      isNative: false,
      name: 'pToken-name',
      chainId: bsc.id,
      symbol: 'pToken-symbol',
      pTokenAddress: '0xA15BB66138824a1c7167f5E85b957d04Dd34E468',
      decimals: 18,
      underlyingAsset: nativeAsset,
    } as AssetInfo
    const provider = new pTokensEvmProvider(publicClientBscMock, walletClientBscMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setChainId(assetInfo.chainId)
    builder.setAssetInfo(assetInfo)
    builder.setProvider(provider)
    builder.setProtocolId(Protocol.EOS)
    builder.setVersion(Version.V2)
    const asset = await builder.build()
    expect(asset.adapterAddress).toStrictEqual(getters.getAdapterAddress(assetInfo.chainId))
    expect(asset.type).toStrictEqual(BlockchainType.EVM)
    expect(asset.assetAddress).toStrictEqual('0xA15BB66138824a1c7167f5E85b957d04Dd34E468')
    expect(asset.chainId).toStrictEqual(assetInfo.chainId)
    expect(asset.protocolId).toStrictEqual(Protocol.EOS)
    expect(asset.version).toStrictEqual(Version.V2)
    expect(asset.symbol).toStrictEqual(assetInfo.symbol)
    expect(asset.provider).toEqual(provider)
    expect(asset.assetInfo).toBe(assetInfo)
  })

  it('Should throw if asset and provider chainId do not match', async () => {
    const nativeAsset = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
    } as NativeAsset
    const assetInfo = {
      isNative: false,
      name: 'pToken-name',
      chainId: bsc.id,
      symbol: 'pToken-symbol',
      pTokenAddress: '0xA15BB66138824a1c7167f5E85b957d04Dd34E468',
      decimals: 18,
      underlyingAsset: nativeAsset,
    } as AssetInfo
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setChainId(assetInfo.chainId)
    builder.setAssetInfo(assetInfo)
    builder.setProvider(provider)
    builder.setProtocolId(Protocol.EOS)
    builder.setVersion(Version.V2)
    try {
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Provider chainId: 1 do not match with assetInfo chainId: 56')
    }
  })

  it('Should not create an EVM asset without a valid pTokenAddress', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const assetInfo = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
      pTokenAddress: 'invalid-address',
    } as AssetInfo
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      builder.setChainId(assetInfo.chainId)
      builder.setAssetInfo(assetInfo)
      builder.setVersion(Version.V1)
      builder.setProtocolId(Protocol.EVM)
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('pTokenAddress invalid-address must be a valid address')
    }
  })

  it('Should not create an EVM asset without a supported chainId', async () => {
    const provider = new pTokensEvmProvider(publicClientPolygonMock, walletClientPolygonMock)
    const assetInfo = {
      isNative: true,
      name: 'token-name',
      chainId: polygon.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
      pTokenAddress: 'invalid-address',
    } as AssetInfo
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      builder.setChainId(assetInfo.chainId)
      builder.setAssetInfo(assetInfo)
      builder.setVersion(Version.V1)
      builder.setProtocolId(Protocol.EVM)
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Adapter address for 137 has not been found. Is this chain supported?')
    }
  })

  it('Should not create an EVM asset without chainId', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing chain ID')
    }
  })

  it('Should not create an EVM asset without asset info', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      builder.setChainId(mainnet.id)
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing asset info')
    }
  })

  it('Should not create an EVM asset without version', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    const assetInfo = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
      pTokenAddress: 'invalid-address',
    } as AssetInfo
    try {
      builder.setChainId(mainnet.id)
      builder.setAssetInfo(assetInfo)
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing version')
    }
  })

  it('Should not create an EVM asset without protocol', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const builder = new pTokensEvmAssetBuilder(provider)
    const assetInfo = {
      isNative: true,
      name: 'token-name',
      chainId: mainnet.id,
      symbol: 'token-symbol',
      tokenAddress: '0x700b6A60ce7EaaEA56F065753d8dcB9653dbAD35',
      decimals: 18,
      pTokenAddress: 'invalid-address',
    } as AssetInfo
    try {
      builder.setChainId(mainnet.id)
      builder.setAssetInfo(assetInfo)
      builder.setVersion(Version.V1)
      await builder.build()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing protocol ID')
    }
  })
})
