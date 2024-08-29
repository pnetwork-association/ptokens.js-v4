import { PublicClient, WalletClient } from 'viem'
import { mainnet, polygon } from 'viem/chains'

export const publicClientEthereumMock = { chain: mainnet } as unknown as PublicClient
export const publicClientPolygonMock = { chain: polygon } as unknown as PublicClient
export const walletClientEthereumMock = {
  chain: mainnet,
  account: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
} as unknown as WalletClient
export const walletClientPolygonMock = {
  chain: polygon,
  account: {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  },
} as unknown as WalletClient
