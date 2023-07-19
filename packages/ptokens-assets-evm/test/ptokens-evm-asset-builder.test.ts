import { Blockchain, NetworkId, Network } from 'ptokens-constants'

import { pTokensEvmAssetBuilder, pTokensEvmProvider } from '../src'

describe('EVM asset', () => {
  beforeAll(() => {
    jest.restoreAllMocks()
  })
  test('Should create an EVM asset without provider', async () => {
    const assetInfo = {
      networkId: NetworkId.SepoliaTestnet,
      isNative: false,
      symbol: 'pSYM',
      assetTokenAddress: '123456789',
      underlyingAssetDecimals: 18,
      underlyingAssetNetworkId: NetworkId.SepoliaTestnet,
      underlyingAssetSymbol: 'SYM',
      underlyingAssetName: 'Symbol',
      underlyingAssetTokenAddress: 'underlying-asset-token-address',
    }
    const provider = new pTokensEvmProvider('http://provider.eth')
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setBlockchain(NetworkId.SepoliaTestnet)
    builder.setDecimals(18)
    builder.setAssetInfo(assetInfo)
    const asset = await builder.build()
    expect(asset.blockchain).toStrictEqual(Blockchain.Sepolia)
    expect(asset.network).toStrictEqual(Network.Testnet)
    expect(asset.networkId).toStrictEqual(NetworkId.SepoliaTestnet)
    expect(asset.weight).toEqual(1)
    expect(asset.provider).toEqual(undefined)
  })

  test('Should create an EVM asset with provider', async () => {
    const assetInfo = {
      networkId: NetworkId.SepoliaTestnet,
      isNative: false,
      symbol: 'pSYM',
      assetTokenAddress: '123456789',
      decimals: 18,
      underlyingAssetDecimals: 18,
      underlyingAssetNetworkId: NetworkId.SepoliaTestnet,
      underlyingAssetSymbol: 'SYM',
      underlyingAssetName: 'Symbol',
      underlyingAssetTokenAddress: 'underlying-asset-token-address',
    }
    const provider = new pTokensEvmProvider('http://provider.eth')
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setBlockchain(NetworkId.SepoliaTestnet)
    builder.setAssetInfo(assetInfo)
    builder.setProvider(provider)
    const asset = await builder.build()
    expect(asset.blockchain).toStrictEqual(Blockchain.Sepolia)
    expect(asset.network).toStrictEqual(Network.Testnet)
    expect(asset.networkId).toStrictEqual(NetworkId.SepoliaTestnet)
    expect(asset.weight).toEqual(1)
    expect(asset.provider).toEqual(provider)
  })

  test('Should not create an EVM asset without blockchain data', async () => {
    const provider = new pTokensEvmProvider('http://provider.eth')
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      await builder.build()
      fail()
    } catch (err) {
      expect(err.message).toStrictEqual('Missing chain ID')
    }
  })

  test('Should not create an EVM asset without asset info', async () => {
    const provider = new pTokensEvmProvider('http://provider.eth')
    const builder = new pTokensEvmAssetBuilder(provider)
    try {
      builder.setBlockchain(NetworkId.SepoliaTestnet)
      await builder.build()
      fail()
    } catch (err) {
      expect(err.message).toStrictEqual('Missing asset info')
    }
  })
})
