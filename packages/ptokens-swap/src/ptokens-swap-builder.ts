import { pTokensSwap, DestinationInfo } from './ptokens-swap'
import { pTokensAsset } from 'ptokens-entities'
import { pTokensNode } from 'ptokens-node'
import { stringUtils, validators } from 'ptokens-helpers'
import BigNumber from 'bignumber.js'

export class pTokensSwapBuilder {
  private _sourceAsset: pTokensAsset
  private _destinationAssets: Array<DestinationInfo> = []
  private _amount: BigNumber
  private _node: pTokensNode

  constructor(node: pTokensNode) {
    this._node = node
  }

  public get sourceAsset(): pTokensAsset {
    return this._sourceAsset
  }

  public get destinationAssets(): Array<pTokensAsset> {
    return this._destinationAssets.map((_el) => _el.asset)
  }

  public get amount(): string {
    return this._amount.toFixed()
  }

  public get node(): pTokensNode {
    return this._node
  }

  setSourceAsset(asset: pTokensAsset) {
    this._sourceAsset = asset
    return this
  }

  addDestinationAsset(asset: pTokensAsset, destinationAddress: string, userData: Uint8Array = undefined) {
    const isValidAddressFunction = validators.chainIdToAddressValidatorMap.get(asset.chainId)
    if (!isValidAddressFunction(destinationAddress)) throw new Error('Invalid destination address')
    this._destinationAssets.push({ asset, destinationAddress, userData })
    return this
  }

  setAmount(_amount: number | string) {
    this._amount = BigNumber(_amount)
    return this
  }

  private isValidSwap() {
    return this.destinationAssets.every(
      (_asset) =>
        stringUtils.addHexPrefix(_asset.assetInfo.tokenReference).toLowerCase() ===
        stringUtils.addHexPrefix(this.sourceAsset.assetInfo.tokenReference).toLowerCase()
    )
  }

  build(): pTokensSwap {
    if (!this._amount) throw new Error('Missing amount')
    if (!this._sourceAsset) throw new Error('Missing source asset')
    if (this._destinationAssets.length === 0) throw new Error('Missing destination assets')
    if (!this.isValidSwap()) throw new Error('Invalid swap')
    const ret = new pTokensSwap(this._node, this.sourceAsset, this._destinationAssets, this._amount)
    return ret
  }
}
