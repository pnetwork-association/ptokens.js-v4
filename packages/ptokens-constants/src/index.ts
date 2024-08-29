export enum Chain {
  Mainnet = '0x1',
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
  [Chain.SepoliaTestnet, '0x87415715056DA7A5EB1a30E53C4F4d20B44DB71D'],
  [Chain.Mainnet, '0x55555715056DA7A5EB1a30E53C4F4d20B4455555'], // FIXME: placeholder
])
