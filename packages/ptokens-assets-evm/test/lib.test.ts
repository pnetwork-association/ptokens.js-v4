import { ChainId } from 'ptokens-constants'
import { Log } from 'viem'
import { pad, sha256, concat } from 'viem/utils'

import { isChainIdSupported, formatAddress, getEventPayload } from '../src/lib'

import logs from './utils/logs.json'

describe('isChainIdSupported', () => {
  it('should return the correct ChainId when hexNumber is a valid entry in the ChainId object', () => {
    const hexNumber = '0x1'
    const result = isChainIdSupported(hexNumber)
    expect(result).toBeTruthy()
  })

  it('should return undefined when hexNumber is an empty string', () => {
    const hexNumber = ''
    expect(isChainIdSupported(hexNumber)).toBeFalsy()
  })

  it('should return undefined when the hexNumber is not found in the ChainId object', () => {
    const hexNumber = '0x12345678'
    expect(isChainIdSupported(hexNumber)).toBeFalsy()
  })
})

describe('formatAddress', () => {
  it('should return the correct "0x" prefixed address format if prefix is already in', () => {
    const address = '0x1234567890abcdef1234567890abcdef'
    const expectedAddress = '0x1234567890abcdef1234567890abcdef'
    expect(formatAddress(address)).toEqual(expectedAddress)
  })

  it('should return the correct "0x" prefixed address format if no prefix is provided', () => {
    const address = '1234567890abcdef1234567890abcdef'
    const expectedAddress = '0x1234567890abcdef1234567890abcdef'
    expect(formatAddress(address)).toEqual(expectedAddress)
  })
})

describe('getEventPayload', () => {
  it('should return the correct payload when the input log has a valid address and topics', () => {
    const log: Log = logs[0] as unknown as Log

    const expectedPayload = concat([
      pad('0x45009dd3abbe29db54fc5d893ceaa98a624882df'),
      sha256(
        concat([
          '0x9b706941b48091a1c675b439064f40b9d43c577d9c7134cce93179b9b0bf2a52',
          '0x0000000000000000000000000000000000000000000000000000000000000034',
        ]),
      ),
      '0x00000000000000000000000000000000000000000000000000000000000000340000000000000000000000006379ebd504941f50d5bfde9348b37593bd29c8350000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000059dc221cf400000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266000000000000000000000000000000000000000000000000000000000000002a307866333946643665353161616438384636463463653661423838323732373963666646623932323636293048579088723499abcbbcbdefffaa',
    ])

    expect(getEventPayload(log)).toEqual(expectedPayload)
  })
})
