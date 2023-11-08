import BigNumber from 'bignumber.js'
import PromiEvent from 'promievent'
import { Blockchain, NetworkId, Network } from 'ptokens-constants'
import { TransactionReceipt } from 'viem'

import { pTokensEvmAsset, pTokensEvmProvider } from '../src'
import pNetworkHubAbi from '../src/abi/PNetworkHubAbi'

import receipt from './utils/receiptUserSend.json'
import { publicClient, walletClient } from './utils/viem-clients'

describe('EVM asset', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('constructor', () => {
    test('Should create an EVM asset from constructor', () => {
      const asset = new pTokensEvmAsset({
        assetInfo: {
          networkId: NetworkId.SepoliaTestnet,
          symbol: 'pSYM',
          assetTokenAddress: 'token-contract-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: NetworkId.SepoliaTestnet,
          underlyingAssetSymbol: 'SYM',
          underlyingAssetName: 'Symbol',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
        provider: new pTokensEvmProvider(publicClient),
      })
      expect(asset.symbol).toStrictEqual('pSYM')
      expect(asset.blockchain).toStrictEqual(Blockchain.Sepolia)
      expect(asset.network).toStrictEqual(Network.Testnet)
      expect(asset.networkId).toStrictEqual(NetworkId.SepoliaTestnet)
      expect(asset.weight).toEqual(1)
    })

    test('Should add a walletClient', () => {
      const asset = new pTokensEvmAsset({
        assetInfo: {
          networkId: NetworkId.GnosisMainnet,
          symbol: 'pSYM',
          assetTokenAddress: 'token-contract-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: NetworkId.GnosisMainnet,
          underlyingAssetSymbol: 'SYM',
          underlyingAssetName: 'Symbol',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
        provider: new pTokensEvmProvider(publicClient),
      })
      asset.setWalletClient(walletClient)
      expect(asset.provider['_walletClient']).toStrictEqual(walletClient)
    })
  })

  describe('swap', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    test('Should not call swap if provider is missing', async () => {
      const asset = new pTokensEvmAsset({
        assetInfo: {
          networkId: NetworkId.SepoliaTestnet,
          symbol: 'pSYM',
          assetTokenAddress: 'token-contract-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: NetworkId.SepoliaTestnet,
          underlyingAssetSymbol: 'SYM',
          underlyingAssetName: 'Symbol',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
        provider: new pTokensEvmProvider(publicClient),
      })
      try {
        await asset['swap'](BigNumber(123.456789), 'destination-address', 'destination-chain-id')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('WalletClient not provided')
      }
    })

    test('Should call makeContractSend with userSend', async () => {
      const provider = new pTokensEvmProvider(publicClient, walletClient)
      // const getTransactionReceiptSpy = jest.fn().mockResolvedValue(receipt)
      // publicClient.getTransactionReceipt = getTransactionReceiptSpy
      const makeContractSendMock = jest.fn().mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve) =>
          setImmediate(() => {
            promi.emit('txBroadcasted', 'tx-hash')
            promi.emit('txConfirmed', receipt)
            return resolve(receipt as unknown as TransactionReceipt)
          }),
        )
        return promi
      })
      provider.makeContractSend = makeContractSendMock
      const asset = new pTokensEvmAsset({
        provider: provider,
        assetInfo: {
          networkId: NetworkId.SepoliaTestnet,
          symbol: 'pSYM',
          assetTokenAddress: 'asset-token-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: 'underlying-asset-network-id',
          underlyingAssetSymbol: 'underlying-asset-symbol',
          underlyingAssetName: 'underlying-asset-name',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
      })
      let txHashBroadcasted = ''
      let swapResultConfirmed = null
      // promiEvent works weird with async await syntax -> TODO avoid async await with promiEvent
      const ret = await asset['swap'](BigNumber(123.456789), 'destination-address', 'destination-chain-id')
        .on('txBroadcasted', (_txHash) => {
          txHashBroadcasted = _txHash
        })
        .on('txConfirmed', (_swapResult) => {
          swapResultConfirmed = _swapResult
        })
      expect(txHashBroadcasted).toEqual({ txHash: 'tx-hash' })
      expect(swapResultConfirmed).toEqual({
        operationId: '0x0decc3b04f997633384503d6cd7a9f818d2ce2df6a994c566d1de32662e8630f',
        txHash: '0xa3ca2fe3981b265c3da018120abaf6a454b60f7b5363a3559531f82acdde4308',
      })
      expect(ret).toEqual({
        operationId: '0x0decc3b04f997633384503d6cd7a9f818d2ce2df6a994c566d1de32662e8630f',
        txHash: '0xa3ca2fe3981b265c3da018120abaf6a454b60f7b5363a3559531f82acdde4308',
      })
      expect(makeContractSendMock).toHaveBeenNthCalledWith(
        1,
        {
          abi: pNetworkHubAbi,
          contractAddress: 'hub-address',
          method: 'userSend',
          value: 0n,
        },
        [
          'destination-address',
          'destination-chain-id',
          'underlying-asset-name',
          'underlying-asset-symbol',
          18,
          'underlying-asset-token-address',
          'underlying-asset-network-id',
          'asset-token-address',
          '123456789000000000000',
          '0',
          '0',
          '0x',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ],
      )
    })

    test('Should reject if makeContractSend rejects', async () => {
      const provider = new pTokensEvmProvider(publicClient, walletClient)
      jest.spyOn(provider, 'makeContractSend').mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve, reject) => {
          return reject(new Error('makeContractSend error'))
        })
        return promi
      })
      const asset = new pTokensEvmAsset({
        provider: provider,
        assetInfo: {
          networkId: NetworkId.SepoliaTestnet,
          symbol: 'pSYM',
          assetTokenAddress: 'asset-token-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: 'underlying-asset-network-id',
          underlyingAssetSymbol: 'underlying-asset-symbol',
          underlyingAssetName: 'underlying-asset-name',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
      })
      try {
        await asset['swap'](BigNumber(123.456789), 'destination-address', 'destination-chain-id')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('makeContractSend error')
      }
    })
  })

  describe('monitorCrossChainOperations', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    test('Should call provider monitorCrossChainOperations', async () => {
      const provider = new pTokensEvmProvider(publicClient, walletClient)
      const monitorCrossChainOperationsSpy = jest
        .spyOn(provider, 'monitorCrossChainOperations')
        .mockResolvedValue('tx-hash')
      const asset = new pTokensEvmAsset({
        provider: provider,
        assetInfo: {
          networkId: NetworkId.SepoliaTestnet,
          symbol: 'pSYM',
          assetTokenAddress: 'asset-token-address',
          decimals: 18,
          underlyingAssetDecimals: 18,
          underlyingAssetNetworkId: 'underlying-asset-network-id',
          underlyingAssetSymbol: 'underlying-asset-symbol',
          underlyingAssetName: 'underlying-asset-name',
          underlyingAssetTokenAddress: 'underlying-asset-token-address',
        },
        factoryAddress: 'factory-address',
        hubAddress: 'hub-address',
        pTokenAddress: '0x6a57e6046405eb1a075c3ea51de6447171417e24',
      })
      const ret = await asset['monitorCrossChainOperations']('operation-id', '0x6153ec976a5b3886caf3a88d8d994c4cec24203e')
      expect(ret).toStrictEqual('tx-hash')
      expect(monitorCrossChainOperationsSpy).toHaveBeenCalledTimes(1)
    })
  })
})
