export enum NetworkId {
  SepoliaTestnet = '0xaa36a7',
}

export enum BlockchainType {
  EVM,
  EOSIO,
  UTXO,
  ALGORAND,
}

export const networkIdToTypeMap = new Map<string, BlockchainType>([[NetworkId.SepoliaTestnet, BlockchainType.EVM]])

export enum Blockchain {
  Ethereum,
  Sepolia,
  Goerli,
  Bitcoin,
  Eos,
  Telos,
  Bsc,
  Xdai,
  Polygon,
  Ultra,
  Fio,
  Arbitrum,
  Luxochain,
  Fantom,
  Algorand,
  Libre,
  Litecoin,
  Gnosis,
}

export enum Network {
  Mainnet,
  Testnet,
}

export const AdapterAddress = new Map<NetworkId, string>([
  [NetworkId.SepoliaTestnet, '0x87415715056DA7A5EB1a30E53C4F4d20B44DB71D'],
])
