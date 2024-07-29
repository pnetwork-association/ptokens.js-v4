import { ChainId, networkIdToTypeMap } from '../src/'

describe('networkIdToTypeMap', () => {
  test('Should map all ChainIds', () => {
    expect(Object.values(ChainId).every((_chainId) => networkIdToTypeMap.get(_chainId) !== undefined)).toBeTruthy()
  })
})
