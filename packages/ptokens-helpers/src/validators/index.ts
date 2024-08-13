import { validate } from 'multicoin-address-validator'
import { BlockchainType } from 'ptokens-constants'

const validatorFunction =
  (_blockchain: string, _network = 'prod') =>
  (_address: string) =>
    validate(_address, _blockchain, _network)

export const chainTypeToAddressValidatorMap = new Map<BlockchainType, (_address: string) => boolean>([
  [BlockchainType.EVM, validatorFunction('eth')],
])

export function isValidAddressByChainId(_address: string, _chaintype: BlockchainType) {
  const validator = chainTypeToAddressValidatorMap.get(_chaintype)
  if (validator) return validator(_address)
  throw new Error('Missing address validator')
}
