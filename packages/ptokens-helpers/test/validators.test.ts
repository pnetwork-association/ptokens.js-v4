import { Protocol } from 'ptokens-constants'

import { validators } from '../src/'

describe('isValidAddressByChainId', () => {
  interface AddressCheck {
    address: string
    expected: boolean
  }
  const evmAddresses: AddressCheck[] = [
    { address: '0xE37c0D48d68da5c5b14E5c1a9f1CFE802776D9FF', expected: true },
    { address: '0xAff4d6793F584a473348EbA058deb8caad77a288', expected: true },
    { address: '0x52908400098527886E0F7030069857D2E4169EE7', expected: true },
    { address: '6xAff4d6793F584a473348EbA058deb8caad77a288', expected: false },
    { address: '0xff4d6793F584a473', expected: false },
    { address: 'aFf4d6793f584a473348ebA058deb8caad77a2885', expected: false },
  ]

  const eosAddresses: AddressCheck[] = [
    { address: 'bittrexacct1', expected: true },
    { address: 'bittrexacct.', expected: false },
    { address: 'bittrexaccT1', expected: false },
    { address: 'bit.re.acct1', expected: true },
    { address: 'bittrexacct11', expected: true },
    { address: 'bittrexacct1z', expected: false },
    { address: 'binancecleos', expected: true },
    { address: '123456789012', expected: false },
    { address: '12345678.012', expected: false },
    { address: '1234567890123', expected: false },
    { address: '12345678901', expected: false },
    { address: '12345678901@', expected: false },
    { address: 'binancecleoS', expected: false },
    { address: '.inancecleoS', expected: false },
    { address: 'pnettest1', expected: true },
    { address: 'a', expected: false },
  ]

  const addressesToCheck = new Map<Protocol, { address: string; expected: boolean }[]>([
    [Protocol.EVM, evmAddresses],
    [Protocol.ANTELOPE, eosAddresses],
  ])

  it('Should correctly check address validity', () => {
    expect(
      (Object.values(Protocol).filter((value) => !isNaN(Number(value))) as Protocol[]).every(
        (_type) => addressesToCheck.get(_type) !== undefined,
      ),
    ).toBeTruthy()
    ;(Object.values(Protocol).filter((value) => !isNaN(Number(value))) as Protocol[]).map((_type) =>
      addressesToCheck
        .get(_type)
        ?.map((_a) => expect(validators.isValidAddressByChainId(_a.address, _type)).toBe(_a.expected)),
    )
  })

  it('Should throw if validator is not set', () => {
    try {
      validators.isValidAddressByChainId(evmAddresses[0].address, -1 as Protocol)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing address validator')
    }
  })
})
