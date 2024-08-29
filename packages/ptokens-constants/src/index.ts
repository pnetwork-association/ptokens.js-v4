export enum Chain {
  Mainnet = '0x1',
  Bsc = '0x38',
  SepoliaTestnet = '0xaa36a7',
}

export enum Protocol {
  BITCOIN = 0x00,
  EVM = 0x01,
  EOS = 0x02,
  ALGORAND = 0x03,
}

export enum Version {
  V1 = 0x01,
  V2 = 0x02,
}

export enum BlockchainType {
  EVM,
}

export const AdapterAddress = new Map<Chain, string>([
  [Chain.Mainnet, '0x8ce361602B935680E8DeC218b820ff5056BeB7af'],
  [Chain.Bsc, '0xb19b36b1456E65E3A6D514D3F715f204BD59f431'],
  [Chain.SepoliaTestnet, '0x87415715056DA7A5EB1a30E53C4F4d20B44DB71D'],
])
