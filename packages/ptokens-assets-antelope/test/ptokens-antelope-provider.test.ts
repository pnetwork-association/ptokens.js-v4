import { Session } from '@wharfkit/session'
import { pTokensAntelopeProvider } from '../src'

const MOCK_RPC_URL = 'http://mock.com'
const MOCK_CHAINID = 'mocked_chain_id'
const INIT_ERROR = 'Provider is not initialized. Use init() in order to initialize the provider'
const sessionMock = {chain: {id: MOCK_CHAINID}} as unknown as Session
const wrongChainSessionMock = {chain: {id: 'wrong_chain_id'}} as unknown as Session

describe('Antelope provider', () => {
  let provider: pTokensAntelopeProvider

  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
    provider = new pTokensAntelopeProvider(MOCK_RPC_URL)
  })

  describe('Init', () => {
    it('Init initializes the provider with chainId', async () => {
      provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
      await provider.init()
      expect(provider['_chainId']).toBe(MOCK_CHAINID)
    })

    it('Should throws if already initialized', async () => {
      try{
        provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
        await provider.init()
        await provider.init()
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('Provider already initialized')
      }
    })

    it('Should throws if provider do not return a chainId', async () => {
      try{
        provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({})
        await provider.init()
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual('Provider could not retreive rpc chain info')
      }
    })
  })

  describe('Get chainId', () => {
    it('It should return provider chainId', async () => {
      provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
      await provider.init()
      const chainId = provider.chainId
      expect(chainId).toBe(MOCK_CHAINID)
    })

    it('Should throws if not initialized', async () => {
      try{
        provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
        const chainId = provider.chainId
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(INIT_ERROR)
      }
    })
  })

  describe('Get blockId', () => {
    it('It should return provider chainId', async () => {
      provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
      provider['_client'].v1.chain.get_block_info = jest.fn().mockResolvedValue({id: 'mocked_block_id'})
      await provider.init()
      const blockId = await provider.blockId(1)
      expect(blockId).toBe('mocked_block_id')
    })
  })

  describe('Set session', () => {
    it('It should set a wharfkit session', async () => {
      provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
      await provider.init()
      provider.setSession(sessionMock)
      expect(provider['_session']).toBe(sessionMock)
    })

    it('Should throws if not initialized', async () => {
      try {
        provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
        await provider.setSession(sessionMock)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(INIT_ERROR)
      }
    })

    it('Should throws if not chainId do not match', async () => {
      try{
        provider['_client'].v1.chain.get_info = jest.fn().mockResolvedValue({ chain_id: MOCK_CHAINID })
        await provider.init()
        await provider.setSession(wrongChainSessionMock)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toEqual(`Session chainId wrong_chain_id does not match APIClient chainId mocked_chain_id`)
      }
    })
  })

  // describe('makeContractSend', () => {
  //   it('Should send a contract method', async () => {
  //     const args = [1, 'arg2', 'arg3']
  //     const account = 'account-name'
  //     const contractName = 'contract-account-name'
  //     const permission = 'active'
  //     const action = 'action'
  //     const expectedArgs = {
  //       account: account,
  //       address: contractName,
  //       functionName: action,
  //       args: args,
  //     }
  //     const getAddressMock = jest.fn().mockImplementation(() => {
  //       const promi = new Promise((resolve) =>
  //         setImmediate(() => {
  //           return resolve([account])
  //         }),
  //       )
  //       return promi
  //     })
  //     const writeContractMock = jest.fn().mockImplementation(() => {
  //       const promi = new Promise((resolve) =>
  //         setImmediate(() => {
  //           return resolve('tx-hash')
  //         }),
  //       )
  //       return promi
  //     })
  //     const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
  //       const promi = new Promise((resolve) =>
  //         setImmediate(() => {
  //           return resolve('tx-receipt')
  //         }),
  //       )
  //       return promi
  //     })
  //     const simulateContractMock = jest.fn().mockImplementation(() => {
  //       const promi = new Promise((resolve) =>
  //         setImmediate(() => {
  //           return resolve({ request: 'simulate-write' })
  //         }),
  //       )
  //       return promi
  //     })
  //     walletClientEthereumMock.getAddresses = getAddressMock
  //     walletClientEthereumMock.writeContract = writeContractMock
  //     publicClientEthereumMock.simulateContract = simulateContractMock
  //     publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
  //     let txBroadcastedHash = ''
  //     let txConfirmedReceipt = ''
  //     const txReceipt = await provider
  //       .transact(
  //         {
  //           actionName: action,
  //           contractName: contractName,
  //           permission: permission
  //         },
  //         args,
  //       )
  //       .once('txBroadcasted', (_hash) => {
  //         txBroadcastedHash = _hash
  //       })
  //       .once('txConfirmed', (_hash) => {
  //         txConfirmedReceipt = _hash
  //       })
  //     expect(txReceipt).toEqual('tx-receipt')
  //     expect(txBroadcastedHash).toEqual('tx-hash')
  //     expect(txConfirmedReceipt).toEqual('tx-receipt')
  //     expect(getAddressMock).toHaveBeenCalledTimes(1)
  //     expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
  //     expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
  //     expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
  //       confirmations: 1,
  //       hash: stringUtils.addHexPrefix('tx-hash'),
  //     })
  //   })
  // })

})