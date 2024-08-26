import { Operation } from 'ptokens-entities'
import { concat, Log, pad, TransactionReceipt } from 'viem'
import { bsc, mainnet } from 'viem/chains'

import * as utils from '../src/lib'

import { eap } from './utils/eventAttestatorProof'
import settleReceipt from './utils/settleReceipt.json'
import swapReceipt from './utils/swapReceipt.json'
import wrongReceipt from './utils/wrongReceipt.json'

const CONTEXT = {
  eth: '0x01010000000000000000000000000000000000000000000000000000000000000001',
  bsc: '0x01010000000000000000000000000000000000000000000000000000000000000038',
}

const peginSwap = swapReceipt[0]
const pegoutSwap = swapReceipt[1]
const peginSettle = settleReceipt[0]
const pegoutSettle = settleReceipt[1]
const peginSwapLog = peginSwap.logs[8] as unknown as Log
const pegoutSwapLog = pegoutSwap.logs[2] as unknown as Log
const peginSettleLog = peginSettle.logs[1] as unknown as Log
const pegoutSettleLog = pegoutSettle.logs[8] as unknown as Log

const peginExpectedOperation = {
  blockId: '0xa898367bfed3cfe01bb518a718e31affa774e4380effb09b8e8ce3ad498c83f6',
  txId: '0x36242dcbc54db506555d65aa13a16946054d0bdb66102130ab105573e43ccb7c',
  nonce: 5n,
  erc20: '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
  originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000038',
  amount: 5888200000000000000n,
  sender: '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
  recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  data: '0x',
}

const pegoutExpectedOperation = {
  blockId: '0x96c4c1772961ba7dd3dd4c098c652e86bbf15b91f734562e04617d0a90ff7325',
  txId: '0xcc148487ba556797603f87abc2c74f105c73650af0ee6cee6d06dba48aa24f2d',
  nonce: 0n,
  erc20: '0x000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35',
  originChainId: '0x0000000000000000000000000000000000000000000000000000000000000038',
  destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  amount: 5888100000000000000n,
  sender: '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  data: '0xc0de',
}

describe('ethereum utilities', () => {
  describe('getEventPayload', () => {
    it('should return the correct payload when the input log has a valid address and topics', () => {
      const log = peginSwapLog

      const expectedPayload = concat([
        pad('0x8ce361602b935680e8dec218b820ff5056beb7af'),
        concat([
          '0x9b706941b48091a1c675b439064f40b9d43c577d9c7134cce93179b9b0bf2a52',
          '0x0000000000000000000000000000000000000000000000000000000000000005',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ]),
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea0000000000000000000000000000000000000000000000000000000000000005000000000000000000000000700b6a60ce7eaaea56f065753d8dcb9653dbad35000000000000000000000000000000000000000000000000000000000000003800000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000',
      ])

      expect(utils.getEventPayload(log)).toEqual(expectedPayload)
    })

    it('should throw if log is not a swap log', () => {
      try {
        const log = peginSettleLog
        utils.getEventPayload(log)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Invalid swap event log format')
      }
    })
  })

  describe('getEventPreImage', () => {
    it('should throw if blockHash is not in log', () => {
      try {
        const log = peginSwapLog
        utils.getEventPreImage({ ...log, blockHash: null }, CONTEXT.eth as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing block hash')
      }
    })

    it('should throw if transactionHash is not in log', () => {
      try {
        const log = peginSwapLog
        utils.getEventPreImage({ ...log, transactionHash: null }, CONTEXT.eth as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing transaction hash')
      }
    })

    it.each([
      [peginSwapLog, CONTEXT.eth, eap[0].preimage],
      [pegoutSwapLog, CONTEXT.bsc, eap[1].preimage],
    ])('should return the preimage given swap log and context', (_log, _context, _expectedPreimage) => {
      const preimage = utils.getEventPreImage(_log, _context as `0x${string}`)
      expect(preimage).toEqual(_expectedPreimage)
    })
  })

  describe('getSwapEventId', () => {
    it.each([
      [peginSwapLog, CONTEXT.eth, eap[0].eventid],
      [pegoutSwapLog, CONTEXT.bsc, eap[1].eventid],
    ])(
      'should return the correct eventId when swap log and context are provided',
      (_log, _context, _expectedEventId) => {
        const eventId = utils.getSwapEventId(_log, _context as `0x${string}`)
        expect(eventId).toEqual(_expectedEventId)
      },
    )
  })

  describe('getEventIdFromSettleLog', () => {
    it.each([
      [peginSettleLog, eap[0].eventid],
      [pegoutSettleLog, eap[1].eventid],
    ])('should return the correct eventId from settle log', (_log, _expectedEventId) => {
      const eventId = utils.getEventIdFromSettleLog(_log)
      expect(eventId).toEqual(_expectedEventId)
    })

    it('should throw if log is not a settle log', () => {
      try {
        const log = peginSwapLog
        utils.getEventIdFromSettleLog(log)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Invalid settle event log format')
      }
    })
  })

  describe('getOperationFromLog', () => {
    it.each([
      [peginSwapLog, mainnet.id, peginExpectedOperation],
      [pegoutSwapLog, bsc.id, pegoutExpectedOperation],
    ])('should return the correct eventId when log and context are provided', (_log, _chainId, _expectedOperation) => {
      const operation = utils.getOperationFromLog(_log, _chainId)
      expect(operation).toEqual(_expectedOperation)
    })

    it('should throw if blockHash is not in log', () => {
      try {
        const log = peginSwapLog
        utils.getOperationFromLog({ ...log, blockHash: null }, mainnet.id)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('blockHash not retreived correctly')
      }
    })

    it('should throw if nonces do not match', () => {
      try {
        const log = peginSwapLog
        utils.getOperationFromLog(
          {
            ...log,
            data: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea000000000000000000000000000000000000000000000000000000000000000100000000000000000000000012975173b87f7595ee45dffb2ab812ece596bf84000000000000000000000000000000000000000000000000000000000000008900000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000',
          },
          mainnet.id,
        )
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual(
          'nonce: 5 and decodedNonce: 0x0000000000000000000000000000000000000000000000000000000000000001 must be equal',
        )
      }
    })

    it('should throw if transactionHash is not in log', () => {
      try {
        const log = peginSwapLog
        utils.getOperationFromLog({ ...log, transactionHash: null }, mainnet.id)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('transactionHash not retreived correctly')
      }
    })

    it('should throw if log is not a swap log', () => {
      try {
        const log = peginSettleLog
        utils.getOperationFromLog(log, mainnet.id)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Invalid swap event log format')
      }
    })
  })

  describe('getLogFromTransactionReceipt', () => {
    it('should return swap log from transcation receipt', () => {
      const log: Log = utils.getLogFromTransactionReceipt(swapReceipt[0] as unknown as TransactionReceipt)
      const expectedLog = peginSwapLog
      expect(log).toStrictEqual(expectedLog)
    })

    it('should throw if not a swap receipt', () => {
      try {
        utils.getLogFromTransactionReceipt(wrongReceipt as unknown as TransactionReceipt)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('No valid event in the receipt logs')
      }
    })
  })

  describe('getOperationFromTransactionReceipt', () => {
    it.each([
      [peginSwap, mainnet.id, peginExpectedOperation],
      [pegoutSwap, bsc.id, pegoutExpectedOperation],
    ])('should return operation from transcation receipt', (_receipt, _chainId, _expectedOperation) => {
      const operation: Operation = utils.getOperationFromTransactionReceipt(
        _chainId,
        _receipt as unknown as TransactionReceipt,
      )
      expect(operation).toStrictEqual(_expectedOperation)
    })
  })
})
