import { Chain } from 'ptokens-constants'

type AssetInfo = {
  isLocal: boolean
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

type Signature = {
  r: string
  s: string
  v: string
}

type Metadata = {
  block_id_hash: string
  data: object
  event_payload: string
  origin: string
  protocol: string
  public_key: string
  signature: Signature
  tx_id_hash: string
  version: string
}

export { Metadata, Operation, Context, AssetInfo, Signature }
