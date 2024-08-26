import { AbiEvent } from 'abitype'
import { Operation } from 'ptokens-entities'
import {
  Log,
  decodeEventLog,
  toEventSelector,
  TransactionReceipt,
  slice,
  hexToNumber,
  hexToString,
  size,
  hexToBigInt,
  concat,
  pad,
  sha256,
  numberToHex,
} from 'viem'

import pNetworkAdapterAbi from '../abi/PNetworkAdapterAbi'

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum EVENT_NAMES {
  SWAP = 'Swap',
  SETTLE = 'Settled',
}

const SLOT = 32

const events = pNetworkAdapterAbi.filter(({ type }) => type === 'event') as AbiEvent[]

export const eventNameToSignatureMap = new Map<string, string>(
  events.map((_event) => {
    const signature = toEventSelector(_event)
    return [_event.name, signature]
  }),
)

export const getEventPayload = (_log: Log): `0x${string}` => {
  const decodedLogArgs = decodeAdapterLog(_log)
  const topics = [0, 1, 2, 3].map((i) => (_log.topics[i] as `0x${string}`) || pad('0x0'))
  if (!isSwapLog(decodedLogArgs)) throw new Error('Invalid swap event log format')
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return concat([pad(_log.address), ...topics, _log.data])
}

export const getEventPreImage = (_log: Log, _context: `0x${string}`): `0x${string}` => {
  if (!_log.blockHash) throw new Error('Missing block hash')
  if (!_log.transactionHash) throw new Error('Missing transaction hash')
  return concat([_context, _log.blockHash, _log.transactionHash, getEventPayload(_log)])
}

export const getEventIdFromSwapLog = (_log: Log, _context: `0x${string}`): `0x${string}` =>
  sha256(getEventPreImage(_log, _context), 'hex')

export const getEventIdFromSettleLog = (_log: Log): `0x${string}` => {
  const decodedLogArgs = decodeAdapterLog(_log)
  if (!isSettleLog(decodedLogArgs)) throw new Error('Invalid settle event log format')
  return decodedLogArgs.eventId
}

export const serializeOperation = (operation: Operation) => [
  operation.blockId,
  operation.txId,
  operation.nonce,
  operation.erc20,
  operation.originChainId,
  operation.destinationChainId,
  operation.amount,
  operation.sender,
  operation.recipient,
  operation.data,
]

export const isSwapLog = (
  args: ReturnType<typeof decodeAdapterLog>,
): args is { nonce: bigint; eventBytes: { content: `0x${string}` } } =>
  typeof args === 'object' && args !== null && 'nonce' in args && 'eventBytes' in args

export const isSettleLog = (args: ReturnType<typeof decodeAdapterLog>): args is { eventId: `0x${string}` } =>
  typeof args === 'object' && args !== null && 'eventId' in args

export const decodeAdapterLog = (_log: Log) => {
  const decodedLog = decodeEventLog({
    abi: pNetworkAdapterAbi,
    ..._log,
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return decodedLog.args
}

export const getOperationFromLog = (_log: Log, _chainId: number): Operation => {
  let offset = 0

  if (!_log.blockHash) throw new Error('blockHash not retreived correctly')
  if (!_log.transactionHash) throw new Error('transactionHash not retreived correctly')

  const decodedLogArgs = decodeAdapterLog(_log)
  if (!isSwapLog(decodedLogArgs)) throw new Error('Invalid swap event log format')
  const { nonce, eventBytes } = decodedLogArgs

  const decodedNonce = slice(eventBytes.content, offset, (offset += SLOT))
  const erc20 = slice(eventBytes.content, offset, (offset += SLOT))
  const destinationChainId = slice(eventBytes.content, offset, (offset += SLOT))
  const amountTransferred = slice(eventBytes.content, offset, (offset += SLOT))
  const sender = slice(eventBytes.content, offset, (offset += SLOT))
  const hexRecipientLength = slice(eventBytes.content, offset, (offset += SLOT))

  if (hexToBigInt(decodedNonce) != nonce)
    throw new Error(`nonce: ${nonce} and decodedNonce: ${decodedNonce} must be equal`)

  const recipientLength = hexToNumber(hexRecipientLength, { size: 32 })
  const recipient = hexToString(slice(eventBytes.content, offset, (offset += recipientLength)), {
    size: recipientLength,
  })
  const data = size(eventBytes.content) > offset ? slice(eventBytes.content, offset) : '0x'

  return {
    blockId: _log.blockHash,
    txId: _log.transactionHash,
    nonce: nonce,
    erc20: erc20,
    originChainId: pad(numberToHex(_chainId)),
    destinationChainId: pad(destinationChainId),
    amount: hexToBigInt(amountTransferred),
    sender: sender,
    recipient: recipient,
    data: data,
  }
}

export const getLogFromTransactionReceipt = (_swapReceipt: TransactionReceipt<bigint>) => {
  const log = _swapReceipt.logs.find(
    (_log) =>
      _log.topics[0] === eventNameToSignatureMap.get(EVENT_NAMES.SWAP) ||
      _log.topics[0] === eventNameToSignatureMap.get(EVENT_NAMES.SETTLE),
  )
  if (!log) throw new Error('No valid event in the receipt logs')
  return log
}

export const getOperationFromTransactionReceipt = (
  _chainId: number,
  _swapReceipt: TransactionReceipt<bigint>,
): Operation => {
  const swapLog = getLogFromTransactionReceipt(_swapReceipt)
  return getOperationFromLog(swapLog, _chainId)
}

// export const getDefaultEvmProvider = (_chain: Chain) =>
//   new pTokensEvmProvider(
//     createPublicClient({
//       chain: _chain,
//       transport: http(),
//     }),
//   )
