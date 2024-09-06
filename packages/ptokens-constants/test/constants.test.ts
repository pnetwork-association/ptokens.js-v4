import { Chain, chainToProtocolMap } from '../src/'

describe('chainToProtocolMap', () => {
  test('Should map all Chains', () => {
    expect(Object.values(Chain).every((_chain) => chainToProtocolMap.get(_chain) !== undefined)).toBeTruthy()
  })
})
