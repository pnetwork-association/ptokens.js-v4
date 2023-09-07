import { Blockchain, NetworkId, Network } from 'ptokens-constants'

import { pTokensEvmAssetBuilder, pTokensEvmProvider } from '../src'
import ABI from '../src/abi/PFactroryAbi'

describe('EVM asset', () => {
  beforeAll(() => {
    jest.restoreAllMocks()
  })

  test('Should create an EVM asset with provider', async () => {
    const assetInfo = {
      networkId: NetworkId.ArbitrumMainnet,
      isNative: false,
      symbol: 'pSYM',
      assetTokenAddress: '123456789',
      decimals: 18,
      underlyingAssetDecimals: 18,
      underlyingAssetNetworkId: NetworkId.GnosisMainnet,
      underlyingAssetSymbol: 'SYM',
      underlyingAssetName: 'Symbol',
      underlyingAssetTokenAddress: 'underlying-asset-token-address',
    }
    const provider = new pTokensEvmProvider('http://provider.eth')
    const makeContractCallSpy = jest.spyOn(provider, 'makeContractCall').mockResolvedValueOnce('hub-address')
    const builder = new pTokensEvmAssetBuilder(provider)
    builder.setBlockchain(NetworkId.ArbitrumMainnet)
    builder.setAssetInfo(assetInfo)
    builder.setProvider(provider)
    const asset = await builder.build()
    expect(makeContractCallSpy).toHaveBeenCalledTimes(1)
    expect(makeContractCallSpy).toHaveBeenNthCalledWith(1, {
      abi: ABI,
      method: 'hub',
      contractAddress: '0xcf9De65e9bB5F7fE8643dA066aB6cBC691De0Fe7',
    })
    expect(asset.hubAddress).toStrictEqual('hub-address')
    expect(asset.blockchain).toStrictEqual(Blockchain.Arbitrum)
    expect(asset.network).toStrictEqual(Network.Mainnet)
    expect(asset.networkId).toStrictEqual(NetworkId.ArbitrumMainnet)
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
