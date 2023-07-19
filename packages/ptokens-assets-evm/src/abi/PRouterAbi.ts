export default [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_factory',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'assetAmount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'assetTokenAddress',
        type: 'address',
      },
    ],
    name: 'InvalidAssetParameters',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidUserOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NoUserOperation',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'pTokenAddress',
        type: 'address',
      },
    ],
    name: 'PTokenNotCreated',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'destinationAccount',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'destinationNetworkId',
        type: 'bytes4',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'underlyingAssetName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'underlyingAssetSymbol',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'underlyingAssetDecimals',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'underlyingAssetTokenAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bytes4',
        name: 'underlyingAssetNetworkId',
        type: 'bytes4',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'assetTokenAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'assetAmount',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'userData',
        type: 'bytes',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'optionsMask',
        type: 'bytes32',
      },
    ],
    name: 'UserOperation',
    type: 'event',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'destinationAccount',
        type: 'string',
      },
      {
        internalType: 'bytes4',
        name: 'destinationNetworkId',
        type: 'bytes4',
      },
      {
        internalType: 'string',
        name: 'underlyingAssetName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'underlyingAssetSymbol',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'underlyingAssetDecimals',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'underlyingAssetTokenAddress',
        type: 'address',
      },
      {
        internalType: 'bytes4',
        name: 'underlyingAssetNetworkId',
        type: 'bytes4',
      },
      {
        internalType: 'address',
        name: 'assetTokenAddress',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'assetAmount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'userData',
        type: 'bytes',
      },
      {
        internalType: 'bytes32',
        name: 'optionsMask',
        type: 'bytes32',
      },
    ],
    name: 'userSend',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const
