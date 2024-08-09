import { AdapterAddress, Chain } from 'ptokens-constants'

import { getAdapterAddress } from '../src/getters/index'

describe('getAdapterAddress', () => {
  it('should return the correct adapter address for a valid chain id number', () => {
    const chainId = 1
    const result = getAdapterAddress(chainId)
    expect(result).toBe(AdapterAddress.get(Chain.Mainnet))
  })

  it('should return the correct adapter address for a valid chain id string', () => {
    const chainId = '0x1'
    const result = getAdapterAddress(chainId)
    expect(result).toBe(AdapterAddress.get(Chain.Mainnet))
  })

  it('should be undefinded for an invalid chain id', () => {
    const invalidChainId = 'invalid'
    const result = getAdapterAddress(invalidChainId)
    expect(result).toBe(undefined)
  })
})
