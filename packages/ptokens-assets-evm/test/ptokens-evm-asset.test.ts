import axios from 'axios'
import PromiEvent from 'promievent'
import { Chain, Protocol, Version } from 'ptokens-constants'
import { AssetInfo, SettleResult, SwapResult } from 'ptokens-entities'
import { TransactionReceipt } from 'viem'

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

const destinationAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
const nativeTokenAddress = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
const pTokenAddress = '0x199A551C5B09F08a03536668416778a4C2239148'
const nativeChain = Chain.EthereumMainnet
const chain = Chain.EthereumMainnet
const nativeAssetInfo: AssetInfo = {
  isNative: true,
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
  isNative: false,
  nativeChain: nativeChain,
  chain: chain,
  name: 'token-name',
  symbol: 'token-symbol',
  decimals: 18,
  address: pTokenAddress,
  pTokenAddress: pTokenAddress,
  nativeTokenAddress: nativeTokenAddress,
}
const brokenNativeAssetInfo: AssetInfo = {
  isNative: true,
  nativeChain: nativeChain,
  chain: chain,
  name: 'token-name',
  symbol: 'token-symbol',
  decimals: 18,
  address: pTokenAddress,
  pTokenAddress: pTokenAddress,
  nativeTokenAddress: nativeTokenAddress,
}
const brokenpTokenAssetInfo: AssetInfo = {
  isNative: false,
  nativeChain: nativeChain,
  chain: chain,
  name: 'token-name',
  symbol: 'token-symbol',
  decimals: 18,
  address: nativeTokenAddress,
  pTokenAddress: pTokenAddress,
  nativeTokenAddress: nativeTokenAddress,
}

// const operation = {
//   amount: 5888200000000000000n, // using an actual transaction which amount differs from the one called above.
//   blockId: peginSwapReceipt.blockHash,
//   data: '0x',
//   destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000038',
//   erc20: '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
//   nonce: 5n,
//   originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
//   recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
//   sender: '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
//   txId: '0x36242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c',
// }
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
      })
      expect(asset.adapterAddress).toStrictEqual('adapter-address')
      expect(asset.assetInfo).toStrictEqual(nativeAssetInfo)
      expect(asset.protocol).toStrictEqual(Protocol.EVM)
      expect(asset.version).toStrictEqual(Version.V1)
      expect(asset.chainId).toStrictEqual(publicClientEthereumMock.chain?.id)
      expect(asset.provider['_publicClient']).toStrictEqual(publicClientEthereumMock)
    })

    it('Should create a pToken EVM asset from constructor', () => {
      const asset = new pTokensEvmAsset({
        assetInfo: pTokenAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
      })
      expect(asset.adapterAddress).toStrictEqual('adapter-address')
      expect(asset.assetInfo).toStrictEqual(pTokenAssetInfo)
      expect(asset.protocol).toStrictEqual(Protocol.EVM)
      expect(asset.version).toStrictEqual(Version.V1)
      expect(asset.chainId).toStrictEqual(publicClientEthereumMock.chain?.id)
      expect(asset.provider['_publicClient']).toStrictEqual(publicClientEthereumMock)
    })

    it('Should throw if asset is native and chain do not match with nativeChain', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: { ...nativeAssetInfo, nativeChain: Chain.PolygonMainnet },
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: '' as unknown as Version,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('the asset is native: chain 0x1 and nativeChain 0x89 must be equal')
      }
    })

    it('Should throw if asset chain do not match with provider chain', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: { ...pTokenAssetInfo, chain: Chain.PolygonMainnet },
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: '' as unknown as Version,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('Provider chainId: 1 do not match with assetInfo chainId: 137')
      }
    })

    it('Should throw if asset address is not valid', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: { ...pTokenAssetInfo, address: 'invalid-address', pTokenAddress: 'invalid-address' },
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: '' as unknown as Version,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('pTokenAddress invalid-address must be a valid address')
      }
    })

    it('Should throw if asset pTokenAddress is not valid', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: { ...nativeAssetInfo, pTokenAddress: 'invalid-address' },
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: '' as unknown as Version,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('pTokenAddress invalid-address must be a valid address')
      }
    })

    it('Should throw if asset nativeTokenAddress is not valid', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: { ...pTokenAssetInfo, nativeTokenAddress: 'invalid-address' },
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: '' as unknown as Version,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('nativeTokenAddress invalid-address must be a valid address')
      }
    })

    it('Should throw if pToken address do not match pTokenAddress', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: brokenpTokenAssetInfo,
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: Version.V2,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(
          `the asset is not native: pTokenAddress ${brokenpTokenAssetInfo.pTokenAddress} and address ${brokenpTokenAssetInfo.address} must be equal`,
        )
      }
    })

    it('Should throw if native address do not match nativeAssetAddress', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: brokenNativeAssetInfo,
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: Version.V2,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(
          `the asset is native: nativeTokenAddress ${brokenNativeAssetInfo.nativeTokenAddress} and address ${brokenNativeAssetInfo.address} must be equal`,
        )
      }
    })

    it('Should throw if assetInfo is missing', () => {
      try {
        new pTokensEvmAsset({
          assetInfo: undefined as unknown as AssetInfo,
          adapterAddress: 'adapter-address',
          provider: new pTokensEvmProvider(publicClientEthereumMock),
          version: Version.V2,
        })
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('Missing assetInfo')
      }
    })
  })

  describe('setWalletClient', () => {
    beforeEach(() => {
      jest.restoreAllMocks()
    })

    it('Should add a walletClient', () => {
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
      })
      try {
        await asset['swap'](12345678n, destinationAddress, Chain.BscMainnet)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('WalletClient not provided')
      }
    })

    it('Should throw if destination address is not valid', async () => {
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
      })
      try {
        await asset['swap'](12345678n, 'invalid-address', Chain.BscMainnet)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(`invalid-address is not a valid address for chain ${Chain.BscMainnet}`)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      let txHashBroadcasted = ''
      let swapResultConfirmed = null
      const ret = await asset['swap'](123456789n, destinationAddress, Chain.BscMainnet)
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
        [nativeAssetInfo.address, 123456789n, Chain.BscMainnet, destinationAddress, '0x'],
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      try {
        await asset['swap'](123456789n, destinationAddress, Chain.BscMainnet)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      asset['_provider'] = undefined as unknown as pTokensEvmProvider
      try {
        await asset['swap'](123456789n, destinationAddress, Chain.BscMainnet)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: new pTokensEvmProvider(publicClientEthereumMock),
        version: Version.V1,
      })
      try {
        await asset['settle'](peginSwapReceipt.logs[8], Chain.EthereumMainnet, metadata)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      let txHashBroadcasted = ''
      let settleResultConfirmed = null
      const ret = await asset['settle'](peginSwapReceipt.logs[8], Chain.EthereumMainnet, metadata)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      try {
        await asset['settle'](peginSwapReceipt.logs[8], Chain.EthereumMainnet, metadata)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      asset['_provider'] = undefined as unknown as pTokensEvmProvider
      try {
        await asset['settle'](peginSwapReceipt.logs[8], Chain.EthereumMainnet, metadata)
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
      const asset = new pTokensEvmAsset({
        assetInfo: nativeAssetInfo,
        adapterAddress: 'adapter-address',
        provider: provider,
        version: Version.V1,
      })
      try {
        await asset['settle'](peginSwapReceipt.logs[8], Chain.EthereumMainnet, metadata)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Invalid settle event log format')
      }
    })
  })
})
