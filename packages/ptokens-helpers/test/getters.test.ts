import { Chain } from 'ptokens-constants'

import { getChain } from '../src/getters'

describe('getChain', () => {
  // Valid inputs as strings
  it('should return Mainnet for string "0x1"', () => {
    expect(getChain('0x1')).toBe(Chain.EthereumMainnet)
  })

  it('should return Bsc for string "0x38"', () => {
    expect(getChain('0x38')).toBe(Chain.BscMainnet)
  })

  // Valid inputs as numbers
  it('should return Gnosis for number 0x64', () => {
    expect(getChain(0x64)).toBe(Chain.GnosisMainnet)
  })

  it('should return Polygon for number 0x89', () => {
    expect(getChain(0x89)).toBe(Chain.PolygonMainnet)
  })

  // Invalid input: non-existing chain ID as string
  it('should throw an error for invalid string chain ID', () => {
    expect(() => getChain('0x999')).toThrow('Invalid chain ID: 0x999')
  })

  // Invalid input: non-existing chain ID as number
  it('should throw an error for invalid number chain ID', () => {
    expect(() => getChain(0x999)).toThrow('Invalid chain ID: 0x999')
  })
})
