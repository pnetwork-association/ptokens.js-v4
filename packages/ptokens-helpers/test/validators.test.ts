import { BlockchainType } from 'ptokens-constants'

import { validators } from '../src/'

describe('chainIdToAddressValidatorMap', () => {
  it('Should get an address validator for every blockchain type', () => {
    expect(
      (Object.values(BlockchainType).filter((value) => !isNaN(Number(value))) as BlockchainType[]).every(
        (_type) => validators.chainTypeToAddressValidatorMap.get(_type) !== undefined,
      ),
    ).toBeTruthy()
  })
})

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

  const addressesToCheck = new Map<BlockchainType, { address: string; expected: boolean }[]>([
    [BlockchainType.EVM, evmAddresses],
  ])

  it('Should correctly check address validity', () => {
    expect(
      (Object.values(BlockchainType).filter((value) => !isNaN(Number(value))) as BlockchainType[]).every(
        (_type) => addressesToCheck.get(_type) !== undefined,
      ),
    ).toBeTruthy()
    ;(Object.values(BlockchainType).filter((value) => !isNaN(Number(value))) as BlockchainType[]).map(
      (_type) =>
        addressesToCheck
          .get(_type)
          ?.map((_a) => expect(validators.isValidAddressByChainId(_a.address, _type)).toBe(_a.expected)),
    )
  })

  it('Should throw if validator is not set', () => {
    try {
      validators.isValidAddressByChainId(evmAddresses[0].address, -1 as BlockchainType)
      fail()
    } catch (_err) {
      if (!(_err instanceof Error)) throw new Error('Invalid Error type')
      expect(_err.message).toStrictEqual('Missing address validator')
    }
  })
})
