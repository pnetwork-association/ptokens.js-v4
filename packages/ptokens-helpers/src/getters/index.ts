import { AdapterAddress, Chain } from 'ptokens-constants'

import { addHexPrefix } from '../string'

export function getAdapterAddress(chainId: string | number): string | undefined {
  if (typeof chainId === 'number') {
    chainId = addHexPrefix(chainId.toString(16))
  }
  return AdapterAddress.get(chainId as Chain)
}
