import { Bytes, TransactResult } from "@wharfkit/session"
import { Operation } from "ptokens-entities"

const SLOT = 32
const EOS_TOPIC_ZERO = '0000000000000000000000000000000000000000000000000000000073776170'
const EOS_ZERO_SLOT = '0000000000000000000000000000000000000000000000000000000000000000'

export const getTraceFromTransactionResponse = (_swapResult: TransactResult) => {
  const actionTraces = _swapResult.response.processed.action_traces
  if (!actionTraces) throw new Error('actionTraces not found')
  const trace = actionTraces.find(
    (actionTrace) =>
      actionTrace.act.name === 'swap' ||
      actionTrace.act.name === 'settle',
  )
  if (!trace) throw new Error('No valid trace in the receipt logs')
  return trace
}

export const getOperationFromTrace = (_trace: any, _chainId: string): Operation => {
  let offset = 0

  if (!_trace.block_id) throw new Error('blockHash not retreived correctly')
  if (!_trace.trx_id) throw new Error('transactionHash not retreived correctly')

  const data: string = _trace.act.data.event_byte
  if (!data) throw new Error('No data found in swap action trace')

  const nonce = data.slice(offset, (offset += 2*SLOT))
  const token = data.slice(offset, (offset += 2*SLOT))
  const destinationChainId = data.slice(offset, (offset += 2*SLOT))
  const amountTransferred = data.slice(offset, (offset += 2*SLOT))
  const sender = data.slice(offset, (offset += 2*SLOT))
  const hexRecipientLength = data.slice(offset, (offset += 2*SLOT))
  const recipientLength = Number(`0x${hexRecipientLength}`)
  const hexRecipient = data.slice(offset, (offset += 2*recipientLength))
  const buffer = Buffer.from(hexRecipient, 'hex')
  const recipient = buffer.toString('utf8')
  const userData = data.length > offset ? data.slice(offset) : '0x'

  return {
    blockId: _trace.block_id,
    txId: _trace.trx_id,
    nonce: BigInt(`0x${nonce}`),
    erc20: token,
    originChainId: _chainId,
    destinationChainId: destinationChainId,
    amount: BigInt(`0x${amountTransferred}`),
    sender: sender,
    recipient: recipient,
    data: userData,
  }
}

export const getEventPayload = (_trace: any): string => {
  const topics = [
    EOS_TOPIC_ZERO,
    EOS_ZERO_SLOT,
    EOS_ZERO_SLOT,
    EOS_ZERO_SLOT
  ]
  return [
    String(Bytes.from(_trace.act.account).zeropad(32)),
    ...topics,
    String(Bytes.from(_trace.act.data).zeropad(32)),
  ].join('')
}

export const getEventPreImage = (_trace: any, _context: string): string => {
  if (!_trace.block_id) throw new Error('Missing block hash')
  if (!_trace.trx_id) throw new Error('Missing transaction hash')
  return [_context, _trace.block_id, _trace.trx_id, getEventPayload(_trace)].join('')
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