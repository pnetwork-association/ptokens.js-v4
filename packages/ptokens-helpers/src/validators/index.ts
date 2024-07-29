import { validate } from 'multicoin-address-validator'
import { ChainId } from 'ptokens-constants'

const validatorFunction =
  (_blockchain: string, _network = 'prod') =>
  (_address: string) =>
    validate(_address, _blockchain, _network)

export const chainIdToAddressValidatorMap: Map<ChainId, (_address: string) => boolean> = new Map([
  [ChainId.SepoliaTestnet, validatorFunction('eth')],
])

export function isValidAddressByChainId(_address: string, _networkId: ChainId) {
  const validator = chainIdToAddressValidatorMap.get(_networkId)
  if (validator) return validator(_address)
  throw new Error('Missing address validator')
}
