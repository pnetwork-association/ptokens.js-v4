import { Chain, AdapterAddress } from '../src/'

describe('ChainToAdapterAddressMap', () => {
  test('Should map all ChainIds', () => {
    expect(Object.values(Chain).every((_chain) => AdapterAddress.get(_chain) !== undefined)).toBeTruthy()
  })
})
