import { TransactionReceipt, createPublicClient, createWalletClient, http } from 'viem'
import { mainnet, polygon } from 'viem/chains'

import { pTokensEvmProvider } from '../src'
import * as utils from '../src/lib'
import abi from './utils/exampleContractABI'
import logs from './utils/logs.json'

const receiptWithFalseStatus = require('./utils/receiptWithFalseStatus')
const receiptWithTrueStatus = require('./utils/receiptWithTrueStatus')

const publicClient = createPublicClient({ 
  chain: mainnet,
  transport: http()
})

const walletClient = createWalletClient({
  chain: mainnet,
  transport: http()
})

const walletClient2 = createWalletClient({
  chain: polygon,
  transport: http()
})

describe('EVM provider', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should throw with negative gas price', () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    try {
      provider.setGasPrice(-1n)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas price')
    }
  })

  test('Should throw with negative gas price', () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    try {
      provider.setGasPrice(BigInt(1e12))
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas price')
    }
  })

  test('Should throw with negative gas limit', () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    try {
      provider.setGasLimit(BigInt(10e6))
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toEqual('Invalid gas limit')
    }
  })

  test('Should set a walletClient', () => {
    const provider = new pTokensEvmProvider(publicClient)
    provider.setWalletClient(walletClient)
    expect(provider['_walletClient']).toBe(walletClient)
  })

  test('Should overwrite walletClient', () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    provider.setWalletClient(walletClient2)
    expect(provider['_walletClient']).toBe(walletClient2)
  })

  // test('Should throw if factory address does not exists', async () => {
  //   jest.spyOn(require('ptokens-constants').FactoryAddress, 'get').mockReturnValue(undefined)
  //   const provider = new pTokensEvmProvider(publicClient)
  //   try {
  //     const a = await provider.getInterimHubAddress()
  //     fail()
  //   } catch (_err) {
  //     if (!(_err instanceof Error)) throw new Error('Invalid Error type')
  //     expect(_err.message).toEqual('makeContractCall exception')
  //   }
  // })

  // test('Should throw if call fails', async () => {
  //   const provider = new pTokensEvmProvider(publicClient)
  //   try {
  //     const makeContractCallMock = jest.fn().mockImplementation(() => {
  //       return Promise.reject(new Error('makeContractCall exception'))
  //     })
  //     provider.makeContractCall = makeContractCallMock
  //     const a = await provider.getInterimHubAddress()
  //     fail()
  //   } catch (_err) {
  //     if (!(_err instanceof Error)) throw new Error('Invalid Error type')
  //     expect(_err.message).toEqual('makeContractCall exception')
  //   }
  // })

  // TODO add support for privateKey walletClients

  // test('Should add account from private key', () => {
  //   const provider = new pTokensEvmProvider(publicClient, walletClient)
  //   const addAccountSpy = jest.spyOn(provider['_web3'].eth.accounts.wallet, 'add')
  //   provider.setPrivateKey('422c874bed50b69add046296530dc580f8e2e253879d98d66023b7897ab15742')
  //   expect(addAccountSpy).toHaveBeenCalledTimes(1)
  //   expect(provider['_web3'].eth.defaultAccount).toEqual('0xdf3B180694aB22C577f7114D822D28b92cadFd75')
  // })

  // test('Should not add account from invalid private key', () => {
  //   const provider = new pTokensEvmProvider(publicClient, walletClient)
  //   try {
  //     provider.setPrivateKey('invalid-key')
  //     fail()
  //   } catch (err) {
  //     expect(err.message).toEqual('Invalid Private Key, Not a valid string or uint8Array')
  //   }
  // })

  test('Should call a contract method', async () => {
    const provider = new pTokensEvmProvider(publicClient)
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
      args: args
    }
    const publicReadContractMock = jest.fn().mockImplementation(() => {
      const promi = new Promise((resolve) =>
        setImmediate(() => {
          return resolve('publicClientCall')
        }),
      )
      return promi
    })
    publicClient.readContract = publicReadContractMock
    const res = await provider.makeContractCall(
      options,
      args,
    )
    expect(res).toEqual('publicClientCall')
    expect(publicReadContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
  })

  test('Should call a contract method with no arguments', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
    publicClient.readContract = publicReadContractMock
    const res = await provider.makeContractCall<number, []>(
      options
    )
    expect(res).toEqual('publicClientCall')
    expect(publicReadContractMock).toHaveBeenNthCalledWith(1, expectedArgs)
  })

  test('Should send a contract method', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: 1, hash: 'tx-hash'})
  })

  test('Should send a contract method with no arguments', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: 1, hash: 'tx-hash'})
  })

  test('Should send a contract method with waiting for n confirmation', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: confs, hash: 'tx-hash'})
  })

  test('Should send a contract method with set gas price and gas limit', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: 1, hash: 'tx-hash'})
  })

  test('Should send a contract method with set gas price', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: 1, hash: 'tx-hash'})
  })

  test('Should send a contract method with set gas price and gas limit', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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
    expect(waitForTransactionReceiptMock).toHaveBeenNthCalledWith(1, {confirmations: 1, hash: 'tx-hash'})
  })

  test('Should reject if walletClient is not defined', async () => {
    const provider = new pTokensEvmProvider(publicClient)
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
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    const getAddressMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('getAddresses exception'))
    })
    walletClient.getAddresses = getAddressMock
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
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
    walletClient.getAddresses = getAddressMock
    publicClient.simulateContract = simulateContractMock
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
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
        }),
      )
      return promi
    })
    const writeContractMock = jest.fn().mockImplementation(() => {
      return Promise.reject(new Error('writeContract exception'))
    })
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
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
    const provider = new pTokensEvmProvider(publicClient, walletClient)
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
          return resolve({request: 'simulate-write'})
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
    walletClient.getAddresses = getAddressMock
    walletClient.writeContract = writeContractMock
    publicClient.simulateContract = simulateContractMock
    publicClient.waitForTransactionReceipt = waitForTransactionReceiptMock
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

  /**
   * @deprecated Now using https://viem.sh/docs/actions/public/waitForTransactionReceipt.html
   */
  test('Should wait for transaction confirmation', async () => {
    const provider = new pTokensEvmProvider(publicClient)
    const waitForConfirmationSpy = jest
      .spyOn(publicClient, 'getTransactionReceipt')
      .mockRejectedValueOnce(new Error('getTransactionReceipt error'))
      .mockResolvedValueOnce(receiptWithFalseStatus as TransactionReceipt)
      .mockResolvedValue(receiptWithTrueStatus as TransactionReceipt)
    const ret = await provider.waitForTransactionConfirmation(
      '0x5d65fa769234d6eef32baaeeb267dd1b3b8e0ff2e04a0861e2d36af26d631046',
      500,
    )
    expect(waitForConfirmationSpy).toHaveBeenCalledTimes(3)
    expect(ret).toBe('0x5d65fa769234d6eef32baaeeb267dd1b3b8e0ff2e04a0861e2d36af26d631046')
  })

  test('Should return the latest block number', async () => {
    const provider = new pTokensEvmProvider(publicClient)
    const clientGetBlockMock = jest.fn().mockImplementation(() => Promise.resolve({ number: 1333n }))
    publicClient.getBlock = clientGetBlockMock
    const ret = await provider.getLatestBlockNumber()
    expect(clientGetBlockMock).toHaveBeenCalledTimes(1)
    expect(ret).toBe(1333n)
  })

  test('Should return a operationQueued log', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    const eventName = utils.EVENT_NAMES.OPERATION_QUEUED
    const retLog = logs[1]
    const getLogsMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('getPastLogs error'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([retLog])
      .mockResolvedValue([])
    publicClient.getLogs = getLogsMock
    const ret = await provider['_pollForHubOperation'](
      '0x6153ec976A5B3886caF3A88D8d994c4CEC24203E',
      eventName,
      48606850n,
      '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
    )
    expect(ret).toBe(retLog)
    expect(getLogsMock).toHaveBeenCalledTimes(3)
  })

  test('Should return a operationExecuted log', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    const eventName = utils.EVENT_NAMES.OPERATION_EXECUTED
    const retLog = logs[2]
    const getLogsMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('getPastLogs error'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([retLog])
      .mockResolvedValue([])
    publicClient.getLogs = getLogsMock
    const ret = await provider['_pollForHubOperation'](
      '0x6153ec976A5B3886caF3A88D8d994c4CEC24203E',
      eventName,
      48606850n,
      '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
    )
    expect(ret).toBe(retLog)
    expect(getLogsMock).toHaveBeenCalledTimes(3)
  })

  test('Should return a operationCanceled log', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    const eventName = utils.EVENT_NAMES.OPERATION_CANCELLED
    const retLog = logs[7]
    const getLogsMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('getPastLogs error'))
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([retLog])
      .mockResolvedValue([])
    publicClient.getLogs = getLogsMock
    const ret = await provider['_pollForHubOperation'](
      '0x6153ec976A5B3886caF3A88D8d994c4CEC24203E',
      eventName,
      48634151n,
      '0xc3e33a15fb36d4c813c32d85e8005baf94b37d032c9830f00009aa536966e5b3',
    )
    expect(ret).toBe(retLog)
    expect(getLogsMock).toHaveBeenCalledTimes(3)
  })

  test('Should monitor a cross chain operation', async () => {
    let operationQueuedObject = null, operationExecutedObject = null
    const operationCancelledObject = null
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    const getLogsMock = jest
      .fn()
      .mockResolvedValueOnce(logs[1])
      .mockResolvedValueOnce(logs[2])
    publicClient.getBlock = jest.fn().mockImplementation(() => Promise.resolve({ number: 1300n }))
    provider['_pollForHubOperation'] = getLogsMock
    const ret = await provider
      .monitorCrossChainOperations(
        '0x8Fe7F9993e8e5fCA029a0D5ABF177dE052FaF0B5',
        '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
      )
      .on('operationQueued', (_obj) => {
        operationQueuedObject = _obj
      })
      .on('operationExecuted', (_obj) => {
        operationExecutedObject = _obj
      })
    expect(getLogsMock).toHaveBeenCalledTimes(2)
    expect(getLogsMock).toHaveBeenNthCalledWith(1, 
      '0x8Fe7F9993e8e5fCA029a0D5ABF177dE052FaF0B5',
      utils.EVENT_NAMES.OPERATION_QUEUED,
      300n,
      '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
    )
    expect(getLogsMock).toHaveBeenNthCalledWith(2, 
      '0x8Fe7F9993e8e5fCA029a0D5ABF177dE052FaF0B5',
      utils.EVENT_NAMES.OPERATION_EXECUTED,
      300n,
      '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
    )
    expect(operationQueuedObject).toStrictEqual('0x530555c2b4f2d9be613b763e9dbe126b958ef44382f9db7b5001eb078050ccda')
    expect(operationExecutedObject).toStrictEqual('0xa3ca2fe3981b265c3da018120abaf6a454b60f7b5363a3559531f82acdde4308')
    expect(ret).toStrictEqual('0xa3ca2fe3981b265c3da018120abaf6a454b60f7b5363a3559531f82acdde4308')
    expect(operationCancelledObject).toStrictEqual(null)
  })

  test('Should reject when an error occurs monitoring a cross chain operation', async () => {
    const provider = new pTokensEvmProvider(publicClient, walletClient)
    provider['_publicClient'].getBlock = jest.fn().mockRejectedValue(new Error('error'))
    try {
      await provider.monitorCrossChainOperations(
        '0x8Fe7F9993e8e5fCA029a0D5ABF177dE052FaF0B5',
        '0xb68e25afc0680bd3930459e5cfd3bc5b4cc0c07a67cfab9433a3d9337b2996ca',
      )
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('error')
    }
  })
})
