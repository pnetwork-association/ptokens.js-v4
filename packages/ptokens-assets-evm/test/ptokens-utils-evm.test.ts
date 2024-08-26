import { Operation } from 'ptokens-entities'
import { concat, Log, pad, TransactionReceipt } from 'viem'
import { mainnet } from 'viem/chains'

import * as utils from '../src/lib'

import { eap } from './utils/eventAttestatorProof'
import settleReceipt from './utils/settleReceipt.json'
import swapReceipt from './utils/swapReceipt.json'
import wrongReceipt from './utils/wrongReceipt.json'

const CONTEXT = [
  '0x01010000000000000000000000000000000000000000000000000000000000000001',
  '0x01010000000000000000000000000000000000000000000000000000000000000038',
]

const peginSwapLog = swapReceipt[0].logs[8] as unknown as Log
const peginSettleLog = settleReceipt[0].logs[1] as unknown as Log

const expectedOperation = {
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
        utils.getEventPreImage({ ...log, blockHash: null }, CONTEXT[0] as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing block hash')
      }
    })

    it('should throw if transactionHash is not in log', () => {
      try {
        const log = peginSwapLog
        utils.getEventPreImage({ ...log, transactionHash: null }, CONTEXT[0] as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing transaction hash')
      }
    })

    it('should return the preimage given log and context', () => {
      const log = peginSwapLog
      const preimage = utils.getEventPreImage(log, CONTEXT[0] as `0x${string}`)
      expect(preimage).toEqual(eap[0].preimage)
    })
  })

  describe('getSwapEventId', () => {
    it('should return the correct eventId when swap log and context are provided', () => {
      const log = peginSwapLog
      const eventId = utils.getSwapEventId(log, CONTEXT[0] as `0x${string}`)
      expect(eventId).toEqual(eap[0].eventid)
    })
  })

  describe('getEventIdFromSettleLog', () => {
    it('should return the correct eventId from settle log', () => {
      const log = peginSettleLog
      const eventId = utils.getEventIdFromSettleLog(log)
      expect(eventId).toEqual(eap[0].eventid)
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
    it('should return the correct eventId when log and context are provided', () => {
      const log = peginSwapLog
      const operation = utils.getOperationFromLog(log, mainnet.id)
      expect(operation).toEqual(expectedOperation)
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
    it('should return operation from transcation receipt', () => {
      const operation: Operation = utils.getOperationFromTransactionReceipt(
        mainnet.id,
        swapReceipt[0] as unknown as TransactionReceipt,
      )
      expect(operation).toStrictEqual(expectedOperation)
    })
  })
})
