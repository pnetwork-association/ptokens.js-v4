import { AbiEvent } from 'abitype'
import { Protocol } from 'ptokens-constants'
import { Operation } from 'ptokens-entities'
import { validators } from 'ptokens-helpers'
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
  erc20Abi,
  zeroAddress,
  isAddress,
} from 'viem'

import pNetworkAdapterAbi from '../abi/PNetworkAdapterAbi'
import xerc20Abi from '../abi/xerc20Abi'
import { pTokensEvmProvider } from '../ptokens-evm-provider'

export enum EVENT_NAMES {
  SWAP = 'Swap',
  SETTLE = 'Settled',
}

const TOPIC0 = '0x66756e6473206172652073616675207361667520736166752073616675202e2e'

const SLOT = 32

const events = pNetworkAdapterAbi.filter(({ type }) => type === 'event') as AbiEvent[]

export const eventNameToSignatureMap = new Map<string, string>(
  events.map((_event) => {
    const signature = toEventSelector(_event)
    return [_event.name, signature]
  }),
)

export const getEventPayload = (_log: Log): `0x${string}` => {
  const topics = [0, 1, 2, 3].map((i) => (_log.topics[i] as `0x${string}`) || pad('0x0'))
  if (!isSwapLog(_log)) throw new Error('Invalid swap event log format')
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

export const isSwapLog = (_log: Log) => _log.topics[0] === TOPIC0

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

  if (!isSwapLog) throw new Error('Invalid swap event log format')
  const eventBytes = _log.data

  const decodedNonce = slice(eventBytes, offset, (offset += SLOT))
  const erc20 = slice(eventBytes, offset, (offset += SLOT))
  const destinationChainId = slice(eventBytes, offset, (offset += SLOT))
  const amountTransferred = slice(eventBytes, offset, (offset += SLOT))
  const sender = slice(eventBytes, offset, (offset += SLOT))
  const hexRecipientLength = slice(eventBytes, offset, (offset += SLOT))
  const recipientLength = hexToNumber(hexRecipientLength, { size: 32 })
  const recipient = hexToString(slice(eventBytes, offset, (offset += recipientLength)), {
    size: recipientLength,
  })
  const data = size(eventBytes) > offset ? slice(eventBytes, offset) : '0x'

  return {
    blockId: _log.blockHash,
    txId: _log.transactionHash,
    nonce: BigInt(decodedNonce),
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
      _log.topics[0] === TOPIC0 ||
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

export const getErc20Address = async (
  _adapterAddress: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<`0x${string}`> => {
  try {
    return await _evmProvider.makeContractCall<`0x${string}`, []>({
      contractAddress: _adapterAddress,
      method: 'erc20',
      abi: pNetworkAdapterAbi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}

export const getXerc20Address = async (
  _adapterAddress: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<`0x${string}`> => {
  if (!validators.isValidAddressByChainId(_adapterAddress, Protocol.EVM)) throw new Error('Invalid Adapter Address')
  try {
    return await _evmProvider.makeContractCall<`0x${string}`, []>({
      contractAddress: _adapterAddress,
      method: 'xerc20',
      abi: pNetworkAdapterAbi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}

export const getLockboxAddress = async (
  _xerc20Address: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<`0x${string}`> => {
  if (!validators.isValidAddressByChainId(_xerc20Address, Protocol.EVM)) throw new Error('Invalid xerc20 Address')
  try {
    return await _evmProvider.makeContractCall<`0x${string}`, []>({
      contractAddress: _xerc20Address,
      method: 'lockbox',
      abi: xerc20Abi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}

export const isLocalAsset = async (
  _xerc20Address: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<boolean> => {
  if (!isAddress(_xerc20Address)) throw new Error('Invalid xerc20 Address')
  const lockboxAddress = await getLockboxAddress(_xerc20Address, _evmProvider)
  if (lockboxAddress === zeroAddress) return false
  else return true
}

export const getAssetName = async (_assetAddress: `0x${string}`, _evmProvider: pTokensEvmProvider): Promise<string> => {
  if (!validators.isValidAddressByChainId(_assetAddress, Protocol.EVM)) throw new Error('Invalid xerc20 Address')
  try {
    return await _evmProvider.makeContractCall<string, []>({
      contractAddress: _assetAddress,
      method: 'name',
      abi: erc20Abi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}

export const getAssetSymbol = async (
  _assetAddress: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<string> => {
  if (!validators.isValidAddressByChainId(_assetAddress, Protocol.EVM)) throw new Error('Invalid xerc20 Address')
  try {
    return await _evmProvider.makeContractCall<string, []>({
      contractAddress: _assetAddress,
      method: 'symbol',
      abi: erc20Abi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}

export const getAssetDecimals = async (
  _assetAddress: `0x${string}`,
  _evmProvider: pTokensEvmProvider,
): Promise<number> => {
  if (!validators.isValidAddressByChainId(_assetAddress, Protocol.EVM)) throw new Error('Invalid xerc20 Address')
  try {
    return await _evmProvider.makeContractCall<number, []>({
      contractAddress: _assetAddress,
      method: 'decimals',
      abi: erc20Abi,
    })
  } catch (_err) {
    if (!(_err instanceof Error)) throw new Error('Invalid Error type')
    throw new Error(_err.message)
  }
}
