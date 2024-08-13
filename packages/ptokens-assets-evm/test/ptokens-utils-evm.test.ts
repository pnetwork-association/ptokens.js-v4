import { Operation } from 'ptokens-entities'
import { concat, Log, pad, sha256, TransactionReceipt } from 'viem'
import { mainnet } from 'viem/chains'

import * as utils from '../src/lib'

import { eap } from './utils/eventAttestatorProof'
import logs from './utils/logs.json'
import swapReceipt from './utils/receiptSwap.json'

const expectedOperation = {
  blockId: '0x4c0a6d1927db6747ec3960cffe4dc9de0c4b1e2961cdc17b7f79d6a450306b7f',
  txId: '0xf353c5ad5c0fa3d69a340dcc1c09d77d205e0ef2d6d20318b795390cea947a01',
  nonce: 0n,
  erc20: '0x0000000000000000000000006379ebd504941f50d5bfde9348b37593bd29c835',
  originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  amount: 5888200000000000000n,
  sender: '0x000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720',
  recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  data: '0x',
}

describe('ethereum utilities', () => {
  describe('getEventPayload', () => {
    it('should return the correct payload when the input log has a valid address and topics', () => {
      const log: Log = logs[0] as unknown as Log

      const expectedPayload = concat([
        pad('0x45009dd3abbe29db54fc5d893ceaa98a624882df'),
        sha256(
          concat([
            '0x9b706941b48091a1c675b439064f40b9d43c577d9c7134cce93179b9b0bf2a52',
            '0x0000000000000000000000000000000000000000000000000000000000000000',
          ]),
        ),
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000006379ebd504941f50d5bfde9348b37593bd29c835000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a307866333946643665353161616438384636463463653661423838323732373963666646623932323636',
      ])

      expect(utils.getEventPayload(log)).toEqual(expectedPayload)
    })
  })

  describe('getEventPreImage', () => {
    it('should throw if blockHash is not in log', () => {
      try {
        const log: Log = logs[0] as unknown as Log
        utils.getEventPreImage({ ...log, blockHash: null }, eap.context as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing block hash')
      }
    })

    it('should throw if transactionHash is not in log', () => {
      try {
        const log: Log = logs[0] as unknown as Log
        utils.getEventPreImage({ ...log, transactionHash: null }, eap.context as `0x${string}`)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('Missing transaction hash')
      }
    })

    it('should return the preimage given log and context', () => {
      const log: Log = logs[0] as unknown as Log
      const preimage = utils.getEventPreImage(log, eap.context as `0x${string}`)
      expect(preimage).toEqual(eap.preimage)
    })
  })

  describe('getSwapEventId', () => {
    it('should return the correct eventId when log and context are provided', () => {
      const log: Log = logs[0] as unknown as Log
      const eventId = utils.getSwapEventId(log, eap.context as `0x${string}`)
      expect(eventId).toEqual(eap.eventid)
    })
  })

  describe('getOperationFromLog', () => {
    it('should return the correct eventId when log and context are provided', () => {
      const log: Log = logs[0] as unknown as Log
      const operation = utils.getOperationFromLog(log, mainnet.id)
      expect(operation).toEqual(expectedOperation)
    })

    it('should throw if blockHash is not in log', () => {
      try {
        const log: Log = logs[0] as unknown as Log
        utils.getOperationFromLog({ ...log, blockHash: null }, mainnet.id)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('blockHash not retreived correctly')
      }
    })

    it('should throw if nonces do not match', () => {
      try {
        const log: Log = logs[0] as unknown as Log
        utils.getOperationFromLog(
          {
            ...log,
            data: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea00000000000000000000000000000000000000000000000000000000000000010000000000000000000000006379ebd504941f50d5bfde9348b37593bd29c835000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000',
          },
          mainnet.id,
        )
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual(
          'nonce: 0 and decodedNonce: 0x0000000000000000000000000000000000000000000000000000000000000001 must be equal',
        )
      }
    })

    it('should throw if transactionHash is not in log', () => {
      try {
        const log: Log = logs[0] as unknown as Log
        utils.getOperationFromLog({ ...log, transactionHash: null }, mainnet.id)
        fail()
      } catch (_err) {
        if (!(_err instanceof Error)) throw new Error('Invalid Error type')
        expect(_err.message).toStrictEqual('transactionHash not retreived correctly')
      }
    })
  })

  describe('getLogFromTransactionReceipt', () => {
    it('should return swap log from transcation receipt', () => {
      const log: Log = utils.getLogFromTransactionReceipt(swapReceipt as unknown as TransactionReceipt)
      const expectedLog: Log = logs[0] as unknown as Log
      expect(log).toStrictEqual(expectedLog)
    })
  })

  describe('getOperationFromTransactionReceipt', () => {
    it('should return operation from transcation receipt', () => {
      const operation: Operation = utils.getOperationFromTransactionReceipt(
        mainnet.id,
        swapReceipt as unknown as TransactionReceipt,
      )
      expect(operation).toStrictEqual(expectedOperation)
    })
  })
})
