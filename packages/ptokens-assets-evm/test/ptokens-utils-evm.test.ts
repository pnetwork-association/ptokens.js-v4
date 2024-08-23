import { Operation } from 'ptokens-entities'
import { concat, Log, pad, TransactionReceipt } from 'viem'
import { mainnet } from 'viem/chains'

import * as utils from '../src/lib'

import { eap } from './utils/eventAttestatorProof'
import logs from './utils/logs.json'
import swapReceipt from './utils/swapReceipt.json'

const expectedOperation = {
  blockId: '0x1a3bcebcc57c2e6771f5b039c4e3323c5990f22b184b30b4107f0bf5953b8263',
  txId: '0x0064351b69850cdc042ee70a922b44796238e69a037bea2d600d07842ddca0fb',
  nonce: 0n,
  erc20: '0x00000000000000000000000012975173b87f7595ee45dffb2ab812ece596bf84',
  originChainId: '0x0000000000000000000000000000000000000000000000000000000000000001',
  destinationChainId: '0x0000000000000000000000000000000000000000000000000000000000000089',
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
        pad('0x82c6d3ed4cd33d8ec1e51d0b5cc1d822eaa0c3dc'),
        concat([
          '0x9b706941b48091a1c675b439064f40b9d43c577d9c7134cce93179b9b0bf2a52',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000',
        ]),
        '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea000000000000000000000000000000000000000000000000000000000000000000000000000000000000000012975173b87f7595ee45dffb2ab812ece596bf84000000000000000000000000000000000000000000000000000000000000008900000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000',
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
            data: '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000ea000000000000000000000000000000000000000000000000000000000000000100000000000000000000000012975173b87f7595ee45dffb2ab812ece596bf84000000000000000000000000000000000000000000000000000000000000008900000000000000000000000000000000000000000000000051b716b3f6748000000000000000000000000000a0ee7a142d267c1f36714e4a8f75612f20a79720000000000000000000000000000000000000000000000000000000000000002a30786633394664366535316161643838463646346365366142383832373237396366664662393232363600000000000000000000000000000000000000000000',
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
