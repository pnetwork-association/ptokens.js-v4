import { PublicClient, Transport, WalletClient, createPublicClient, createWalletClient, http } from 'viem'
import { arbitrum } from 'viem/chains'

export const walletClient = createWalletClient({
  chain: arbitrum,
  transport: http('https://arb1.arbitrum.io/rpc'),
  account: '0x1bfd67037b42cf73acf2047067bd1f2247d9bfd3'
})

export const publicClient = createPublicClient({
    chain: arbitrum,
    transport: http('https://arb1.arbitrum.io/rpc')
  })