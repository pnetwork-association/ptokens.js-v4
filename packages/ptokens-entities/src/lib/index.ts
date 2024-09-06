import { Chain } from 'ptokens-constants'

type AssetInfo = {
  isNative: boolean
  /** The chain ID of the native Asset's blockchain. */
  nativeChain: Chain
  /** The chain ID of the asset's blockchain. */
  chain: Chain
  /** The name of the asset. */
  name: string
  /** Asset symbol */
  symbol: string
  /** Token's decimals. */
  decimals: number
  /** Token smart contract address. */
  address: string
  /** pNetwork address. */
  pTokenAddress: string
  /** Token smart contract address. */
  nativeTokenAddress: string
}

type Operation = {
  blockId: string
  txId: string
  nonce: bigint
  erc20: string
  originChainId: string
  destinationChainId: string
  amount: bigint
  sender: string
  recipient: string
  data: string
}

type Context = {
  version: string
  protocolId: string
  chainId: string
  privateKey: string | undefined
}

type Metadata = {
  signature: string
}

export { Metadata, Operation, Context, AssetInfo }
