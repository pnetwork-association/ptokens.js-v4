const HEX_PREFIX = '0x'
export const zeroEther = HEX_PREFIX + '00'
export const zeroAddress = HEX_PREFIX + '0000000000000000000000000000000000000000'

export const isHexPrefixed = (_string: string) => {
  return _string.slice(0, 2).toLocaleLowerCase() === HEX_PREFIX
}

export const addHexPrefix = (_string: string): `0x${string}` => {
  return isHexPrefixed(_string) ? (_string as `0x${string}`) : ((HEX_PREFIX + _string) as `0x${string}`)
}

export const removeHexPrefix = (_string: string) => {
  return isHexPrefixed(_string) ? _string.substring(2) : _string
}

export const hexStringToBuffer = (_string: string) => {
  return Buffer.from(removeHexPrefix(_string), 'hex')
}

export const splitCamelCase = (str: string): string[] => {
  return str.split(/(?=[A-Z])/)
}

export const zeropad = (_str: string, _length: number): string => {
  return _str.padStart(_length, '0')
}
