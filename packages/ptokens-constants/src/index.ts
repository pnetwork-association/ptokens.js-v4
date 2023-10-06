export enum NetworkId {
  SepoliaTestnet = '0xe15503e4',
  GoerliTestnet = '0xb9286154',
  ArbitrumMainnet = '0xfc8ebb2b',
  GnosisMainnet = '0xd41b1c5b',
  PolygonMainnet = '0xf9b459a1',
  BscMainnet = '0x5aca268b',
}

export enum BlockchainType {
  EVM,
  EOSIO,
  UTXO,
  ALGORAND,
}

export const networkIdToTypeMap = new Map<string, BlockchainType>([
  [NetworkId.SepoliaTestnet, BlockchainType.EVM],
  [NetworkId.GoerliTestnet, BlockchainType.EVM],
  [NetworkId.ArbitrumMainnet, BlockchainType.EVM],
  [NetworkId.GnosisMainnet, BlockchainType.EVM],
  [NetworkId.BscMainnet, BlockchainType.EVM],
  [NetworkId.PolygonMainnet, BlockchainType.EVM],
])

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

export const FactoryAddress = new Map<NetworkId, string>([
  [NetworkId.GoerliTestnet, '0x204a1A1d79Fe5EcF86d5281FA9c6C4CCce80e384'],
  [NetworkId.ArbitrumMainnet, '0xcf9De65e9bB5F7fE8643dA066aB6cBC691De0Fe7'],
  [NetworkId.GnosisMainnet, '0x1f411C1b2AC7b3bB036E85AE2f4684fCd3FDbb98'],
  [NetworkId.BscMainnet, '0xAc8C50d68480838da599781738d83cfBe1Bd43c0'],
  [NetworkId.PolygonMainnet, '0x4650787da4A497496e514EcCFd6F888B7804ebBe'],
])
