# ptokens.js | pNetwork JavaScript API

JavaScript module for interacting with pNetwork v4.

## Introduction
pTokens.js is the library that allows interoperability with the pNetwork interacting with pNetwork bridges.
This library supports **only v4** bridges.

- It's entirely written in TypeScript, but there are ready-to-use bundles to integrate it into your backend/frontend application.
- It's object-oriented designed and implements the builder pattern to ease objects creation
- It permits host-to-host swaps, unleashing the pTokens to pTokens bridge feature.

## Installation
The package is published in the [npm registry](https://www.npmjs.com/package/ptokens).

Initiate your JavaScript/TypeScript project and install it as a dependency:

```shell
$ npm i ptokens
```

## Documentation

The full documentation can be found [here](https://pnetwork-association.github.io/ptokens.js/).

## Examples

Complete examples are available at [examples](https://github.com/pnetwork-association/ptokens.js/tree/master/examples).

## Development

If you wish to contribute, please open a new Pull Request.

Technically speaking, this is a monorepo containing multiple packages. These are managed using [lerna](https://github.com/lerna/lerna). TypeScript source code is transpiled and bundled using [Rollup](https://rollupjs.org/guide/en/).

### Development mode

**Rollup** has the following option available

```
-w, --watch                 Watch files in bundle and rebuild on changes
```

Every package has a dedicated `dev` script that runs **rollup** with the watch option.

These scripts can be run in parallel by executing the following command from the project root directory:

```shell
$ npm run dev
```

In this way, a developer can make adjustments to the codebase and test it on the fly, without the need to build the affected packages.

**Tip:** leave the command running on a separate shell.

### Building

To build a new version of the library, run:

```shell
$ npm run build
```

### Testing
To run tests in Node.js, run:

```shell
$ npm test
```

### Usage
Create an asset from which to create a swap or a settle event.
Use `getProofMetadata` to require the signature from an attestator API.

#### ANTELOPE
##### Swap

```
const symbol = 'TSTA'
const assetInfo: AssetInfo = {
  isLocal: true,
  nativeChain: Chain.Jungle4Testnet,
  chain: Chain.Jungle4Testnet,
  /** The name of the asset. */
  name: 'eoststtoken1',
  /** Asset symbol */
  symbol: symbol,
  /** Token's decimals. */
  decimals: 4,
  /** Token smart contract address. */
  address: 'eoststtoken1',
  /** pNetwork address. */
  pTokenAddress: 'pnetworkxtk2',
  /** Token smart contract address. */
  nativeTokenAddress: 'eoststtoken1'
};
const args = {
chain: {
    id: "73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d",
    url: "https://jungle4.greymass.com",
},
actor: "pnetworkusr2",
permission: "active",
walletPlugin: new WalletPluginPrivateKey(privateKey),
}
const session = new Session(args, {})
const name = (await session.account()).accountName.toString()

const antelopeProvider = new pTokensAntelopeProvider(RPC)
await antelopeProvider.init()
const config: pTokenAntelopeAssetConfig = {assetInfo: assetInfo, adapterAddress: 'pnetworkadp2', version: Version.V1, provider: antelopeProvider}
const eosAsset = new pTokensAntelopeAsset(config)
await eosAsset.setSession(session)
const swapResult = await eosAsset.swap(`1.0000 ${symbol}`, '0xa41657bf225F8Ec7E2010C89c3F084172948264D', Chain.SepoliaTestnet)
  .once('txBroadcasted', (_hash: string) => console.log('1', _hash))
  .once('txConfirmed', (ret: any) => console.log('2', ret))
```

##### Settle
```
const metadata = await getProofMetadata('<AttestatorAPI>', swapResult.txHash, 'sepolia')
const result = await asset.settle(Chain.Sepolia, undefined, swapResult.preimage, swapResult.operation)
```

#### EVM
##### Swap
```
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: sepolia,
  transport: http(),
});

const provider = new pTokensEvmProvider(publicClient as PublicClient, walletClient)
const builder = new pTokensEvmAssetBuilder({ provider: provider, assetNativeChain: Chain.Jungle4Testnet })
builder.setAdapterAddress('0x52eaeF9cC5fFaF6729eBC8504A9d80440BEE9211')
builder.setVersion(Version.V1)
builder.setAssetInfo(pTokenAssetInfo)
const asset = await builder.build()
const txHash = swapResult.txHash
const swapResult = await asset.swap(100000n, 'pnetworkusr2', '0x73e4385a2708e6d7048834fbc1079f2fabb17b3c125b146af438971e90716c4d', '0x')
  .once('txBroadcasted', (_hash: string) => console.log('1', _hash))
  .once('txConfirmed', (ret: any) => console.log('2', ret))
```
#### Settle
```
const metadata: Metadata = await getProofMetadata('<AttestatorAPI>', txHash, 'jungle')
const result = await asset.settle(Chain.Jungle4Testnet, undefined, stringUtils.addHexPrefix(swapResult.preimage), swapResult.operation)
```
