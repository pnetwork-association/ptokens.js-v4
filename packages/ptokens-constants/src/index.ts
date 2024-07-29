export enum ChainId {
  SepoliaTestnet = '0xaa36a7',
}

export enum BlockchainType {
  EVM,
  EOSIO,
  UTXO,
  ALGORAND,
}

export const networkIdToTypeMap = new Map<string, BlockchainType>([[ChainId.SepoliaTestnet, BlockchainType.EVM]])

export const AdapterAddress = new Map<ChainId, string>([
  [ChainId.SepoliaTestnet, '0x87415715056DA7A5EB1a30E53C4F4d20B44DB71D'],
])
