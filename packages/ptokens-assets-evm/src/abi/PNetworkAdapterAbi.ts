export default [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_xerc20',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_erc20',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'AddressInsufficientBalance',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'operationId',
        type: 'bytes32',
      },
    ],
    name: 'AlreadyProcessed',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FailedInnerCall',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fees',
        type: 'uint256',
      },
    ],
    name: 'InsufficientAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidAmount',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'destinationChainId',
        type: 'uint256',
      },
    ],
    name: 'InvalidDestinationChainId',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
    ],
    name: 'InvalidEventContentLength',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidFeesManager',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'actual',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expected',
        type: 'uint256',
      },
    ],
    name: 'InvalidMessageId',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidOperation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSender',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSwap',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'InvalidTokenAddress',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotAllowed',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'RLPInputTooLong',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
    ],
    name: 'SafeERC20FailedOperation',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'eventId',
        type: 'bytes32',
      },
    ],
    name: 'Unauthorized',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'topic',
        type: 'bytes32',
      },
    ],
    name: 'UnexpectedEventTopic',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
    ],
    name: 'UnsupportedChainId',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes1',
        name: 'protocolId',
        type: 'bytes1',
      },
    ],
    name: 'UnsupportedProtocolId',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'ReceiveUserDataFailed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'eventId',
        type: 'bytes32',
      },
    ],
    name: 'Settled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'bytes',
            name: 'content',
            type: 'bytes',
          },
        ],
        indexed: false,
        internalType: 'struct IAdapter.EventBytes',
        name: 'eventBytes',
        type: 'tuple',
      },
    ],
    name: 'Swap',
    type: 'event',
  },
  {
    inputs: [],
    name: 'SWAP_EVENT_TOPIC',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'erc20',
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
    inputs: [],
    name: 'owner',
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
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'pastEvents',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'blockId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'txId',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'nonce',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'erc20',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'originChainId',
            type: 'bytes32',
          },
          {
            internalType: 'bytes32',
            name: 'destinationChainId',
            type: 'bytes32',
          },
          {
            internalType: 'uint256',
            name: 'amount',
            type: 'uint256',
          },
          {
            internalType: 'bytes32',
            name: 'sender',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'data',
            type: 'bytes',
          },
        ],
        internalType: 'struct IAdapter.Operation',
        name: 'operation',
        type: 'tuple',
      },
      {
        components: [
          {
            internalType: 'bytes',
            name: 'preimage',
            type: 'bytes',
          },
          {
            internalType: 'bytes',
            name: 'signature',
            type: 'bytes',
          },
        ],
        internalType: 'struct IPAM.Metadata',
        name: 'metadata',
        type: 'tuple',
      },
    ],
    name: 'settle',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'destinationChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'recipient',
        type: 'string',
      },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'destinationChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'recipient',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'swap',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'destinationChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'recipient',
        type: 'string',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'swapNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'destinationChainId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'recipient',
        type: 'string',
      },
    ],
    name: 'swapNative',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'xerc20',
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
] as const
