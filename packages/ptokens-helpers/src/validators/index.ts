import { validate } from 'multicoin-address-validator'
import { Protocol } from 'ptokens-constants'

// https://docs.eosnetwork.com/docs/latest/core-concepts/accounts/#regex-validation
const isValidAntelopeAddress = (_address: string) => {
  const eosAccountRegex = /(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/
  return eosAccountRegex.test(_address)
}

export function isValidAddressByChainId(_address: string, _protocol: Protocol) {
  if (_protocol == Protocol.ANTELOPE) return isValidAntelopeAddress(_address)
  if (_protocol == Protocol.EVM) return validate(_address, 'eth', 'prod')
  throw new Error('Missing address validator')
}
