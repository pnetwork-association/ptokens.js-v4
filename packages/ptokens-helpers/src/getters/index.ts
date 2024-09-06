import { Chain } from 'ptokens-constants'

import { addHexPrefix } from '../string'

export function getChain(chainId: string | number): Chain {
  const inputAsString = typeof chainId === 'number' ? addHexPrefix(chainId.toString(16)) : addHexPrefix(chainId)
  if (Object.values(Chain).includes(inputAsString as Chain)) return inputAsString as Chain
  throw new Error(`Invalid chain ID: ${inputAsString}`)
}
