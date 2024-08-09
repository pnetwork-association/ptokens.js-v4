type pTokenAsset = {
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
  preimage: string
  signature: string
}

const isNative = (assetInfo: AssetInfo): assetInfo is NativeAsset => {
  return assetInfo.pTokenAddress === undefined && (assetInfo as pTokenAsset).underlyingAsset === undefined
}

const isPToken = (assetInfo: AssetInfo): assetInfo is pTokenAsset => {
  return assetInfo.pTokenAddress === (assetInfo as pTokenAsset).underlyingAsset.pTokenAddress
}

export { Metadata, Operation, Context, pTokenAsset, NativeAsset, AssetInfo, isNative, isPToken }
