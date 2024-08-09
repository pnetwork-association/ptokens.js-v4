import { AdapterAddress, Chain } from 'ptokens-constants'

export function getAdapterAddress(chainId: string | number): string | undefined {
  const chain = chainId as Chain
  return AdapterAddress.get(chain)
}
