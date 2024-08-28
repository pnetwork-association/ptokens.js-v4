type pTokenAsset = {
  isNative: false
  /** The name of the asset. */
  name: string
  /** The chain ID of the asset's blockchain. */
  chainId: number
  /** Asset symbol */
  symbol: string
  /** pToken address. */
  pTokenAddress: string
  /** Token's decimals. */
  decimals: number
  /** Underlying asset information */
  underlyingAsset: NativeAsset
}

type NativeAsset = {
  isNative: true
  /** The name of the asset. */
  name: string
  /** The chain ID of the asset's blockchain. */
  chainId: number
  /** Asset symbol */
  symbol: string
  /** Token smart contract address. */
  tokenAddress: string
  /** Token's decimals. */
  decimals: number
  /** pNetwork address. */
  pTokenAddress?: string
}

type AssetInfo = NativeAsset | pTokenAsset

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

export { Metadata, Operation, Context, pTokenAsset, NativeAsset, AssetInfo }
