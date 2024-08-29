import axios from 'axios'
import PromiEvent from 'promievent'
import { BlockchainType, Protocol, Version } from 'ptokens-constants'
import { AssetInfo, NativeAsset, SettleResult, SwapResult } from 'ptokens-entities'
import { TransactionReceipt } from 'viem'
import { mainnet, polygon } from 'viem/chains'

import { pTokensEvmAsset, pTokensEvmProvider } from '../src'
import pNetworkAdapterAbi from '../src/abi/PNetworkAdapterAbi'

import { eap } from './utils/eventAttestatorProof'
import { publicClientEthereumMock, walletClientEthereumMock } from './utils/mock-viem-clients'
import settleReceipt from './utils/settleReceipt.json'
import swapReceipt from './utils/swapReceipt.json'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const peginSwapReceipt = swapReceipt[0] as unknown as TransactionReceipt
const peginSettleReceipt = settleReceipt[0] as unknown as TransactionReceipt

const operation = {
  amount: 5888200000000000000n, // using an actual transaction which amount differs from the one called above.
  blockId: peginSwapReceipt.blockHash,
  data: '0x',
  destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000038',
  erc20: '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
  nonce: 5n,
  originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  sender: '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
  txId: '0x36242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c',
}
const eventId = '0x681c9ff13cb0777400667bcb8491ce325870ca61325bcd2e371b325845a97805'
const metadata = { signature: eap[0].signature }
const preimage =
  '0x01010000000000000000000000000000000000000000000000000000000000000001a898367bfed3cfe01bb518a718e31affa774e4380effb09b8e8ce3ad498c83f636242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c0000000000000000000000008ce361602b935680e8dec218b820ff5056beb7af9b706941b48091a1c675b439064f40b9d43c577d9c7134cce93179b9b0bf2a520000000000000000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000'

describe('EVM asset', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  describe('EVM asset constructor', () => {
    it('Should create a native EVM asset from constructor', () => {
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      expect(asset.adapterAddress).toStrictEqual('adapter-address')
      expect(asset.symbol).toStrictEqual('token-symbol')
      expect(asset.type).toStrictEqual(BlockchainType.EVM)
      expect(asset.version).toStrictEqual(Version.V1)
      expect(asset.protocolId).toStrictEqual(Protocol.EVM)
      expect(asset.chainId).toStrictEqual(assetInfo.chainId)
      expect(asset.assetAddress).toStrictEqual('token-address')
      expect(asset.assetInfo).toEqual(assetInfo)
      expect(asset.isNative).toEqual(assetInfo.isNative)
      expect(asset.provider['_publicClient']).toStrictEqual(publicClientEthereumMock)
    })

    it('Should create a pToken EVM asset from constructor', () => {
      const nativeAsset = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as NativeAsset
      const assetInfo = {
        isNative: false,
        name: 'pToken-name',
        chainId: polygon.id,
        symbol: 'pToken-symbol',
        pTokenAddress: 'pToken-address',
        decimals: 18,
        underlyingAsset: nativeAsset,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      expect(asset.adapterAddress).toStrictEqual('adapter-address')
      expect(asset.symbol).toStrictEqual('pToken-symbol')
      expect(asset.type).toStrictEqual(BlockchainType.EVM)
      expect(asset.version).toStrictEqual(Version.V1)
      expect(asset.protocolId).toStrictEqual(Protocol.EVM)
      expect(asset.chainId).toStrictEqual(assetInfo.chainId)
      expect(asset.assetAddress).toStrictEqual('pToken-address')
      expect(asset.assetInfo).toEqual(assetInfo)
      expect(asset.isNative).toEqual(assetInfo.isNative)
      expect(asset.provider['_publicClient']).toStrictEqual(publicClientEthereumMock)
    })

    it('Should create a EVM asset from constructor with specified version and protocolId', () => {
      const nativeAsset = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as NativeAsset
      const assetInfo = {
        isNative: false,
        name: 'pToken-name',
        chainId: polygon.id,
        symbol: 'pToken-symbol',
        pTokenAddress: 'pToken-address',
        decimals: 18,
        underlyingAsset: nativeAsset,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V2,
        protocolId: Protocol.EOS,
      })
      expect(asset.adapterAddress).toStrictEqual('adapter-address')
      expect(asset.symbol).toStrictEqual('pToken-symbol')
      expect(asset.type).toStrictEqual(BlockchainType.EVM)
      expect(asset.version).toStrictEqual(Version.V2)
      expect(asset.protocolId).toStrictEqual(Protocol.EOS)
      expect(asset.chainId).toStrictEqual(assetInfo.chainId)
      expect(asset.assetAddress).toStrictEqual('pToken-address')
      expect(asset.assetInfo).toEqual(assetInfo)
      expect(asset.isNative).toEqual(assetInfo.isNative)
      expect(asset.provider['_publicClient']).toStrictEqual(publicClientEthereumMock)
    })

    it('Should throw if decimals are missing', () => {
      try {
        const assetInfo = {
          isNative: true,
          name: 'token-name',
          chainId: mainnet.id,
          symbol: 'token-symbol',
          tokenAddress: 'token-address',
          decimals: 18,
        }
        new pTokensEvmAsset({
          assetInfo: { ...assetInfo, decimals: undefined } as unknown as AssetInfo,
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('Missing decimals')
      }
    })

    it('Should throw if pTokenAddress do not match underlying asset pTokenAddress is missing', () => {
      try {
        const nativeAsset = {
          isNative: true,
          name: 'token-name',
          chainId: mainnet.id,
          symbol: 'token-symbol',
          tokenAddress: 'token-address',
          decimals: 18,
          pTokenAddress: 'pToken-address-2',
        } as NativeAsset
        const assetInfo = {
          isNative: false,
          name: 'pToken-name',
          chainId: polygon.id,
          symbol: 'pToken-symbol',
          pTokenAddress: 'pToken-address',
          decimals: 18,
          underlyingAsset: nativeAsset,
        } as AssetInfo
        new pTokensEvmAsset({
          assetInfo: assetInfo,
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: Version.V2,
          protocolId: Protocol.EOS,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('pToken address does not match underlying asset pToken address')
      }
    })
  })

  describe('setWalletClient', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should add a walletClient', () => {
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      asset.setWalletClient(walletClientEthereumMock)
      expect(asset.provider['_walletClient']).toStrictEqual(walletClientEthereumMock)
    })
  })

  describe('getContext', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should return asset Context', () => {
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      const context = asset.getContext()
      expect(context).toStrictEqual('0x01010000000000000000000000000000000000000000000000000000000000000001')
    })
  })

  describe('swap', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should throw if provider is missing', async () => {
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      try {
        await asset['swap'](12345678n, 'destination-address', 'destination-chain-id')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('WalletClient not provided')
      }
    })

    it('Should call makeContractSend with swap', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const makeContractSendMock = jest.fn().mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve) =>
          setImmediate(() => {
            promi.emit('txBroadcasted', 'txBroadcasted-hash')
            promi.emit('txConfirmed', peginSwapReceipt)
            return resolve(peginSwapReceipt as unknown as TransactionReceipt)
          }),
        )
        return promi
      })
      provider.makeContractSend = makeContractSendMock
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      let txHashBroadcasted = ''
      let swapResultConfirmed = null
      const ret = await asset['swap'](123456789n, 'destination-address', 'destination-chain-id')
        .on('txBroadcasted', (_txHash) => {
          txHashBroadcasted = _txHash
        })
        .on('txConfirmed', (_swapResult) => {
          swapResultConfirmed = _swapResult
        })
      const swapResult: SwapResult = {
        txHash: peginSwapReceipt.transactionHash,
        operation: {
          amount: 5888200000000000000n, // using an actual transaction which amount differs from the one called above.
          blockId: peginSwapReceipt.blockHash,
          data: '0x',
          destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000038',
          erc20: '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
          nonce: 5n,
          originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          sender: '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
          txId: '0x36242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c',
        },
        eventId: eventId,
      }
      expect(txHashBroadcasted).toEqual({ txHash: 'txBroadcasted-hash' })
      expect(swapResultConfirmed).toEqual(swapResult)
      expect(ret).toEqual(swapResult)
      expect(makeContractSendMock).toHaveBeenNthCalledWith(
        1,
        {
          abi: pNetworkAdapterAbi,
          contractAddress: 'adapter-address',
          method: 'swap',
          value: 0n,
        },
        ['token-address', 123456789n, 'destination-chain-id', 'destination-address', '0x'],
      )
    })

    it('Should reject if makeContractSend rejects', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      jest.spyOn(provider, 'makeContractSend').mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve, reject) => {
          return reject(new Error('makeContractSend error'))
        })
        return promi
      })
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      try {
        await asset['swap'](123456789n, 'destination-address', 'destination-chain-id')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('makeContractSend error')
      }
    })

    it('Should reject if provider is not defined', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      jest.spyOn(provider, 'makeContractSend').mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve, reject) => {
          return reject(new Error('makeContractSend error'))
        })
        return promi
      })
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      asset['_provider'] = undefined as unknown as pTokensEvmProvider
      try {
        await asset['swap'](123456789n, 'destination-address', 'destination-chain-id')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing provider')
      }
    })
  })

  describe('getProofMetadata', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should return the signature computed by EventAttestator', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      const axiosMockResponse = { data: { signature: eap[0].signature } }
      mockedAxios.post.mockResolvedValue(axiosMockResponse)
      const signature = await asset.getProofMetadata(
        '0x681c9ff13cb0777400667bcb8491ce325870ca61325bcd2e371b325845a97805',
      )
      expect(signature).toStrictEqual({ signature: eap[0].signature })
    })

    it('Should throw if signature is not returned', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      const axiosMockResponse = { data: { signature: undefined } }
      mockedAxios.post.mockResolvedValue(axiosMockResponse)
      try {
        await asset.getProofMetadata('0x681c9ff13cb0777400667bcb8491ce325870ca61325bcd2e371b325845a97805')
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Data has been retrieved but no signature is available')
      }
    })
  })

  describe('settle', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should throw if provider is missing', async () => {
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
      })
      try {
        await asset['settle'](operation, peginSwapReceipt.logs[8], metadata)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('WalletClient not provided')
      }
    })

    it('Should call makeContractSend with settle', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const makeContractSendMock = jest.fn().mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve) =>
          setImmediate(() => {
            promi.emit('txBroadcasted', 'txBroadcasted-hash')
            promi.emit('txConfirmed', peginSettleReceipt)
            return resolve(peginSettleReceipt as unknown as TransactionReceipt)
          }),
        )
        return promi
      })
      provider.makeContractSend = makeContractSendMock
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      let txHashBroadcasted = ''
      let settleResultConfirmed = null
      const ret = await asset['settle'](operation, peginSwapReceipt.logs[8], metadata)
        .on('txBroadcasted', (_txHash) => {
          txHashBroadcasted = _txHash
        })
        .on('txConfirmed', (_settleResult) => {
          settleResultConfirmed = _settleResult
        })
      const settleResult: SettleResult = {
        txHash: peginSettleReceipt.transactionHash,
        eventId: '0x681c9ff13cb0777400667bcb8491ce325870ca61325bcd2e371b325845a97805',
      }
      expect(txHashBroadcasted).toEqual({ txHash: 'txBroadcasted-hash' })
      expect(settleResultConfirmed).toEqual(settleResult)
      expect(ret).toEqual(settleResult)
      expect(makeContractSendMock).toHaveBeenNthCalledWith(
        1,
        {
          abi: pNetworkAdapterAbi,
          contractAddress: 'adapter-address',
          method: 'settle',
          value: 0n,
        },
        [
          [
            '0xa898367bfed3cfe01bb518a718e31affa774e4380effb09b8e8ce3ad498c83f6',
            '0x36242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c',
            5n,
            '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
            '0x0000000000000000000000000000000000000000000000000000000000000001',
            '0x0000000000000000000000000000000000000000000000000000000000000038',
            5888200000000000000n,
            '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
            '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            '0x',
          ],
          [preimage, eap[0].signature],
        ],
      )
    })

    it('Should reject if makeContractSend rejects', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      jest.spyOn(provider, 'makeContractSend').mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve, reject) => {
          return reject(new Error('makeContractSend error'))
        })
        return promi
      })
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      try {
        await asset['settle'](operation, peginSwapReceipt.logs[8], metadata)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('makeContractSend error')
      }
    })

    it('Should reject if provider is not available', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      jest.spyOn(provider, 'makeContractSend').mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve, reject) => {
          return reject(new Error('makeContractSend error'))
        })
        return promi
      })
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      asset['_provider'] = undefined as unknown as pTokensEvmProvider
      try {
        await asset['settle'](operation, peginSwapReceipt.logs[8], metadata)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing provider')
      }
    })

    it('Should reject if returned receipt logs are not in the correct format', async () => {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const makeContractSendMock = jest.fn().mockImplementation(() => {
        const promi = new PromiEvent<TransactionReceipt>((resolve) =>
          setImmediate(() => {
            promi.emit('txBroadcasted', 'txBroadcasted-hash')
            promi.emit('txConfirmed', peginSwapReceipt)
            return resolve(peginSwapReceipt)
          }),
        )
        return promi
      })
      provider.makeContractSend = makeContractSendMock
      const assetInfo = {
        isNative: true,
        name: 'token-name',
        chainId: mainnet.id,
        symbol: 'token-symbol',
        tokenAddress: 'token-address',
        decimals: 18,
      } as AssetInfo
      const asset = new pTokensEvmAsset({
        assetInfo: assetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
      })
      try {
        await asset['settle'](operation, peginSwapReceipt.logs[8], metadata)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Invalid settle event log format')
      }
    })
  })
})
