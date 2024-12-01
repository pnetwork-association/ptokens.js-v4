export enum Chain {
  EthereumMainnet = '0x1',
  BscMainnet = '0x38',
  GnosisMainnet = '0x64',
  PolygonMainnet = '0x89',
  EosMainnet = '0xaca376f206b8fc25a6ed44dbdc66547c36c6c33e3a119ffbeaef943642f0e906',
}

export enum Protocol {
  EVM = 0x01,
  ANTELOPE = 0x02,
}

export enum Version {
  V1 = 0x01,
  V2 = 0x02,
}

export const chainToProtocolMap = new Map<Chain, Protocol>([
  [Chain.EthereumMainnet, Protocol.EVM],
  [Chain.BscMainnet, Protocol.EVM],
  [Chain.GnosisMainnet, Protocol.EVM],
  [Chain.PolygonMainnet, Protocol.EVM],
  [Chain.EosMainnet, Protocol.ANTELOPE],
])
