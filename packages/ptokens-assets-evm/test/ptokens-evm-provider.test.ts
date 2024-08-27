import { EventEmitter } from 'events'

import * as viem from 'viem'

jest.mock('viem', () => {
  const originalModule = jest.requireActual<typeof viem>('viem')
  return {
    ...originalModule,
    createWalletClient: jest.fn().mockReturnValue('mocked result'),
  }
})

import { TransactionReceipt, Log, createWalletClient, PublicClient, WalletClient, AbiEvent} from 'viem'
import { mainnet, polygon } from 'viem/chains'

import { pTokensEvmProvider } from '../src'

import abi from './utils/exampleContractABI'
import PNetworkAdapterAbi from '../src/abi/PNetworkAdapterAbi'
import { stringUtils } from 'ptokens-helpers'
import { EVENT_NAMES } from '../src/lib'
// import logs from './utils/logs.json'

import settleReceipt from './utils/settleReceipt.json'
import swapReceipt from './utils/swapReceipt.json'
import exampleContractABI from './utils/exampleContractABI'

const peginSwap = swapReceipt[0] as unknown as TransactionReceipt
const pegoutSwap = swapReceipt[1] as unknown as TransactionReceipt
const peginSettle = settleReceipt[0] as unknown as TransactionReceipt
const pegoutSettle = settleReceipt[1] as unknown as TransactionReceipt
const peginSwapLog = peginSwap.logs[8] as unknown as Log
const pegoutSwapLog = pegoutSwap.logs[2] as unknown as Log
const peginSettleLog = peginSettle.logs[1] as unknown as Log
const pegoutSettleLog = pegoutSettle.logs[8] as unknown as Log

const logs = {}

const receiptWithTrueStatus = require('./utils/swapReceipt.json')

const publicClientEthereumMock = {chain: mainnet} as unknown as PublicClient
const walletClientEthereumMock = {
  chain: mainnet,
  account: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  }
} as unknown as WalletClient
const publicClientPolygonMock = {chain: polygon} as unknown as PublicClient
const walletClientPolygonMock = {
  chain: polygon,
  account: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  }
} as unknown as WalletClient

describe('EVM provider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  test('Should throw with negative gas price', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    try {
      provider.setGasPrice(-1n)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas price')
    }
  })

  test('Should throw with negative gas price', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    try {
      provider.setGasPrice(BigInt(1e12))
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas price')
    }
  })

  test('Should throw with negative gas limit', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    try {
      provider.setGasLimit(BigInt(10e6))
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas limit')
    }
  })

  test('Should set a walletClientEthereumMock', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    provider.setWalletClient(walletClientEthereumMock)
    expect(provider['_walletClient']).toBe(walletClientEthereumMock)
  })

  test('Should overwrite walletClientEthereumMock', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    provider.setWalletClient(walletClientPolygonMock)
    expect(provider['_walletClient']).toBe(walletClientPolygonMock)
  })

  test('Should get chain id', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    expect(provider.chainId).toStrictEqual(publicClientEthereumMock.chain?.id)
  })

  test('Should throw if chain id is not found', async () => {
    try {
      const provider = new pTokensEvmProvider({...publicClientEthereumMock, chain: undefined})
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual(`No chain in specified publicClient: ${publicClientEthereumMock}`)
    }
  })

  test('Should add account from private key', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    provider.setPrivateKeyWalletClient('0x422c874bed50b69add046296530dc580f8e2e253879d98d66023b7897ab15742')
    expect(createWalletClient).toHaveBeenCalledTimes(1)
    expect(createWalletClient).toHaveBeenCalledWith(
      expect.objectContaining({
        account: expect.objectContaining({
          address: '0xdf3B180694aB22C577f7114D822D28b92cadFd75',
        }),
        chain: publicClientEthereumMock.chain,
      })
    )
  })

  test('Should not add account from invalid private key', () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    try {
      provider.setPrivateKeyWalletClient('0x1234567890abcdef')
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('private key must be 32 bytes, hex or bigint, not string')
    }
  })

  test('Should call a contract method', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    const options = {
      method: 'number',
      abi,
      contractAddress: '0xb794f5ea0ba39494ce839613fffba74279579268',
    }
    const args = [1, 'arg2', 'arg3']
    const expectedArgs = {
      address: options.contractAddress,
      abi: options.abi,
      functionName: options.method,
      args: args,
    }
    const publicReadContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('publicClientCall')
        }),
      )
      return promi
    })
    publicClientEthereumMock.readContract = publicReadContractMock
    const res = await provider.makeContractCall(options, args)
    expect(res).toEqual('publicClientCall')
    expect(publicReadContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
  })

  test('Should call a contract method with no arguments', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const options = {
      method: 'number',
      abi,
      contractAddress: '0xb794f5ea0ba39494ce839613fffba74279579268',
    }
    const expectedArgs = {
      address: options.contractAddress,
      abi: options.abi,
      functionName: options.method,
      args: [],
    }
    const publicReadContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('publicClientCall')
        }),
      )
      return promi
    })
    publicClientEthereumMock.readContract = publicReadContractMock
    const res = await provider.makeContractCall<number, []>(options)
    expect(res).toEqual('publicClientCall')
    expect(publicReadContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
  })

  test('Should send a contract method', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const args = [1, 'arg2', 'arg3']
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: args,
      gas: undefined,
      gasPrice: undefined,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend(
        {
          method: method,
          abi,
          contractAddress: contractAddress,
          value: value,
        },
        args,
      )
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: 1,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should send a contract method with no arguments', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: [],
      gas: undefined,
      gasPrice: undefined,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend({
        method: method,
        abi,
        contractAddress: contractAddress,
        value: value,
      })
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: 1,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should send a contract method with waiting for n confirmation', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const args = [1, 'arg2', 'arg3']
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const confs = 5
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: args,
      gas: undefined,
      gasPrice: undefined,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend(
        {
          method: method,
          abi,
          contractAddress: contractAddress,
          value: value,
          confirmations: confs,
        },
        args,
      )
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: confs,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should send a contract method with set gas price and gas limit', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const args = [1, 'arg2', 'arg3']
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const gasLmit = 200000n
    const gasPrice = BigInt(100e9)
    provider.setGasLimit(gasLmit)
    provider.setGasPrice(gasPrice)
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: args,
      gas: gasLmit,
      gasPrice: gasPrice,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend(
        {
          method: method,
          abi,
          contractAddress: contractAddress,
          value: value,
        },
        args,
      )
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: 1,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should send a contract method with set gas price', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const args = [1, 'arg2', 'arg3']
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const gasPrice = BigInt(100e9)
    provider.setGasPrice(gasPrice)
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: args,
      gas: undefined,
      gasPrice: gasPrice,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend(
        {
          method: method,
          abi,
          contractAddress: contractAddress,
          value: value,
        },
        args,
      )
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: 1,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should send a contract method with set gas price and gas limit', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const args = [1, 'arg2', 'arg3']
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const contractAddress = '0xb794f5ea0ba39494ce839613fffba74279579268'
    const method = 'setNumber'
    const value = 1n
    const gasLmit = 200000n
    provider.setGasLimit(gasLmit)
    const expectedArgs = {
      account: account,
      address: contractAddress,
      abi: abi,
      functionName: method,
      value: value,
      args: args,
      gas: gasLmit,
      gasPrice: undefined,
    }
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-receipt')
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    let txBroadcastedHash = ''
    let txConfirmedReceipt = ''
    const txReceipt = await provider
      .makeContractSend(
        {
          method: method,
          abi,
          contractAddress: contractAddress,
          value: value,
        },
        args,
      )
      .once('txBroadcasted', (_hash) => {
        txBroadcastedHash = _hash
      })
      .once('txConfirmed', (_hash) => {
        txConfirmedReceipt = _hash
      })
    expect(txReceipt).toEqual('tx-receipt')
    expect(txBroadcastedHash).toEqual('tx-hash')
    expect(txConfirmedReceipt).toEqual('tx-receipt')
    expect(getAddressMock).toHaveBeenCalledTimes(1)
    expect(simulateContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
    expect(writeContractMock).toHaveBeenNthCalledWith(1, 'simulate-write')
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {
      confirmations: 1,
      hash: stringUtils.addHexPrefix('tx-hash'),
    })
  })

  test('Should reject if walletClientEthereumMock is not defined', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: 'contract-address',
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('WalletClient not provided')
    }
  })

  test('Should reject if getAddresses throws', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const getAddressMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('getAddresses exception'))
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: 'contract-address',
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('getAddresses exception')
    }
  })

  test('Should reject if simulateContract throws', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('simulateContract exception'))
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: account,
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('simulateContract exception')
    }
  })

  test('Should reject if writeContract throws', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('writeContract exception'))
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: account,
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('writeContract exception')
    }
  })

  test('Should reject if waitForTransactionReceipt throws', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    const simulateContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve({ request: 'simulate-write' })
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('tx-hash')
        }),
      )
      return promi
    })
    const waitForTransactionReceiptMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('waitForTransactionReceipt exception'))
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    walletClientEthereumMock.writeContract = writeContractMock
    publicClientEthereumMock.simulateContract = simulateContractMock
    publicClientEthereumMock.waitForTransactionReceipt = waitForTransactionReceiptMock
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: account,
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('waitForTransactionReceipt exception')
    }
  })

  test('Should reject if walletClientEthereum account is not defined', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([undefined])
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    try {
      await provider.makeContractSend(
        {
          method: 'setNumber',
          abi,
          contractAddress: 'contract-address',
          value: 1n,
        },
        [1, 'arg2', 'arg3'],
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('No account found for the provided walletClient')
    }
  })

  test('Should wait for transaction confirmation', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    const waitForConfirmationSpy = jest
      .spyOn(publicClientEthereumMock, 'waitForTransactionReceipt')
      .mockResolvedValue(receiptWithTrueStatus as TransactionReceipt)
    const ret = await provider.waitForTransactionConfirmation(
      '0x5d65fa769234d6eef32baaeeb267dd1b3b8e0ff2e04a0861e2d36af26d631046',
      500,
    )
    expect(waitForConfirmationSpy).toHaveBeenCalledTimes(1)
    expect(ret).toBe(receiptWithTrueStatus)
  })

  test('Should return the latest block number', async () => {
    const provider = new pTokensEvmProvider(publicClientEthereumMock)
    const clientGetBlockMock = jest.fn().mockImplementation(() => Promise.resolve({ number: 1333n }))
    publicClientEthereumMock.getBlock = clientGetBlockMock
    const ret = await provider.getLatestBlockNumber()
    expect(clientGetBlockMock).toHaveBeenCalledTimes(1)
    expect(ret).toBe(1333n)
  })

  test('Should throw if returned block do not have a number', async () => {
    try {
      const provider = new pTokensEvmProvider(publicClientEthereumMock)
      const clientGetBlockMock = jest.fn().mockImplementation(() => Promise.resolve({ number: undefined }))
      publicClientEthereumMock.getBlock = clientGetBlockMock
      const ret = await provider.getLatestBlockNumber()
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual(`Viem could not retreive latest block number`)
    }
  })

  test('Should process a log as soon it is found', async () => { 
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const getLogsMock = jest.fn().mockImplementation(({
      toBlock,
    }) => {
      const log1Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([peginSwapLog])
        }),
      )
      const log2Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([pegoutSwapLog])
        }),
      )
      const log3Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([peginSwapLog, pegoutSwapLog])
        }),
      )
      const emptyPromi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([])
        }),
      )

      if (toBlock === 20000n) return log3Promi
      else if (toBlock === 50000n) return log1Promi
      else if (toBlock === 100000n) return log2Promi
      else return emptyPromi
    })
    publicClientEthereumMock.getLogs = getLogsMock
    const onLog = jest.fn()
    await provider._getEvents({
      fromAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      contractAddress: '0x6153ec976A5B3886caF3A88D8d994c4CEC24203E',
      contractAbi: PNetworkAdapterAbi,
      eventName: EVENT_NAMES.SWAP,
      fromBlock: 10n,
      toBlock: 200000n,
      onLog: onLog,
      chunkSize: 1000n,
    })
    expect(onLog).toHaveBeenCalledTimes(4)
    expect(onLog).toHaveBeenNthCalledWith(1, pegoutSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(2, peginSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(3, peginSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(4, pegoutSwapLog)
  })

  test('Should reject if abi is not correct', async () => {
    try {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const getLogsMock = jest.fn().mockImplementation(({
        toBlock,
      }) => {
        const log1Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog])
          }),
        )
        const log2Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([pegoutSwapLog])
          }),
        )
        const log3Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog, pegoutSwapLog])
          }),
        )
        const emptyPromi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([])
          }),
        )

        if (toBlock === 20000n) return log3Promi
        else if (toBlock === 50000n) return log1Promi
        else if (toBlock === 100000n) return log2Promi
        else return emptyPromi
      })
      publicClientEthereumMock.getLogs = getLogsMock
      const onLog = jest.fn()
      await provider._getEvents({
        fromAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        contractAddress: '0x6153ec976A5B3886caF3A88D8d994c4CEC24203E',
        contractAbi: exampleContractABI,
        eventName: EVENT_NAMES.SWAP,
        fromBlock: 10n,
        toBlock: 200000n,
        onLog: onLog,
        chunkSize: 1000n,
      })
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual(`Event ${EVENT_NAMES.SWAP} not found in contract ABI`)
    }
  })

  test('Should emit a event at each swap event and return an array with all the logs when done', async () => { 
    const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
    const getLogsMock = jest.fn().mockImplementation(({
      toBlock,
    }) => {
      const log1Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([peginSwapLog])
        }),
      )
      const log2Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([pegoutSwapLog])
        }),
      )
      const log3Promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([peginSwapLog, pegoutSwapLog])
        }),
      )
      const emptyPromi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([])
        }),
      )

      if (toBlock === 20000n) return log3Promi
      else if (toBlock === 50000n) return log1Promi
      else if (toBlock === 100000n) return log2Promi
      else return emptyPromi
    })
    const getBlockNumberMock = jest.fn().mockImplementation(() => 
      new Promise((resolve) =>
        setImmediate(() => {
          return resolve(200000n)
        }),
      )
    )
    const account = '0xd4E96eF8eee8678dBFf4d535E033Ed1a4F7605b7'
    const getAddressMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve([account])
        }),
      )
      return promi
    })
    walletClientEthereumMock.getAddresses = getAddressMock
    publicClientEthereumMock.getLogs = getLogsMock
    publicClientEthereumMock.getBlockNumber = getBlockNumberMock
    const onLog = jest.fn()
    const events = await provider.getSwaps(0n)
      .on(EVENT_NAMES.SWAP, onLog)
    expect(onLog).toHaveBeenCalledTimes(4)
    expect(onLog).toHaveBeenNthCalledWith(1, pegoutSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(2, peginSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(3, peginSwapLog)
    expect(onLog).toHaveBeenNthCalledWith(4, pegoutSwapLog)
    expect(events).toStrictEqual([pegoutSwapLog, peginSwapLog, peginSwapLog, pegoutSwapLog])
  })

  test('Should throw if adapter is not defined for specified chainId', async () => {
    try {
      const provider = new pTokensEvmProvider({...publicClientEthereumMock, chain: {...mainnet, id: -1}}, walletClientEthereumMock)
      const getLogsMock = jest.fn().mockImplementation(({
        toBlock,
      }) => {
        const log1Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog])
          }),
        )
        const log2Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([pegoutSwapLog])
          }),
        )
        const log3Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog, pegoutSwapLog])
          }),
        )
        const emptyPromi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([])
          }),
        )

        if (toBlock === 20000n) return log3Promi
        else if (toBlock === 50000n) return log1Promi
        else if (toBlock === 100000n) return log2Promi
        else return emptyPromi
      })
      const getBlockNumberMock = jest.fn().mockImplementation(() => 
        new Promise((resolve) =>
          setImmediate(() => {
            return resolve(200000n)
          }),
        )
      )
      publicClientEthereumMock.getLogs = getLogsMock
      publicClientEthereumMock.getBlockNumber = getBlockNumberMock
      const onLog = jest.fn()
      const events = await provider.getSwaps(0n)
        .on(EVENT_NAMES.SWAP, onLog)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual(`Adapter address for -1 not found`)
    }
  })

  test('Should throw if no account is not defined for specified walletClient', async () => {
    try {
      const provider = new pTokensEvmProvider(publicClientEthereumMock, walletClientEthereumMock)
      const getLogsMock = jest.fn().mockImplementation(({
        toBlock,
      }) => {
        const log1Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog])
          }),
        )
        const log2Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([pegoutSwapLog])
          }),
        )
        const log3Promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([peginSwapLog, pegoutSwapLog])
          }),
        )
        const emptyPromi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([])
          }),
        )

        if (toBlock === 20000n) return log3Promi
        else if (toBlock === 50000n) return log1Promi
        else if (toBlock === 100000n) return log2Promi
        else return emptyPromi
      })
      const getBlockNumberMock = jest.fn().mockImplementation(() => 
        new Promise((resolve) =>
          setImmediate(() => {
            return resolve(200000n)
          }),
        )
      )
      const getAddressMock = jest.fn().mockImplementation(() => {
        const promi = new Promise((resolve) =>
          setImmediate(() => {
            return resolve([undefined])
          }),
        )
        return promi
      })
      walletClientEthereumMock.getAddresses = getAddressMock
      publicClientEthereumMock.getLogs = getLogsMock
      publicClientEthereumMock.getBlockNumber = getBlockNumberMock
      const onLog = jest.fn()
      const events = await provider.getSwaps(0n)
        .on(EVENT_NAMES.SWAP, onLog)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual(`No user account found`)
    }
  })
})
