import PromiEvent from 'promievent'
import { BlockchainType, ChainId } from 'ptokens-constants'
import { pTokensAsset, pTokenAssetConfig, SwapResult } from 'ptokens-entities'
import { Log, TransactionReceipt, WalletClient } from 'viem'

import pNetworkHubAbi from './abi/PNetworkHubAbi'
import { getOperationIdFromTransactionReceipt, onChainFormat } from './lib'
import { pTokensEvmProvider } from './ptokens-evm-provider'

const USER_SEND_METHOD = 'userSend'

export type pTokenEvmAssetConfig = pTokenAssetConfig & {
  /** An pTokensEvmProvider for interacting with the underlaying blockchain */
  provider: pTokensEvmProvider
}

export class pTokensEvmAsset extends pTokensAsset {
  private _provider: pTokensEvmProvider

  /**
   * Create and initialize a pTokensEvmAsset object. pTokensEvmAsset objects shall be created with a pTokensEvmAssetBuilder instance.
   */
  constructor(config: pTokenEvmAssetConfig) {
    if (config.assetInfo.decimals === undefined) throw new Error('Missing decimals')
    super(config, BlockchainType.EVM)
    this._provider = config.provider
  }

  get provider() {
    return this._provider
  }

  /**
   * Set a walletProvider.
   * @param _walletClient - A viem walletClient.
   * @returns The same builder. This allows methods chaining.
   */
  setWalletClient(_walletClient: WalletClient): this {
    this._provider.setWalletClient(_walletClient)
    return this
  }

  protected swap(
    _amount: bigint,
    _recipient: string,
    _destinationChainId: string,
    _fees = BigInt(0),
    _optionsMask = '0x0000000000000000000000000000000000000000000000000000000000000000',
    _userData = '0x',
  ): PromiEvent<SwapResult> {
    const promi = new PromiEvent<SwapResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._provider) return reject(new Error('Missing provider'))
            const args = [
              this.assetAddress,
              _amount,
              _destinationChainId,
              _recipient, // destinationAccount
              _userData,
            ]
            const txReceipt: TransactionReceipt = await this._provider
              .makeContractSend(
                {
                  method: USER_SEND_METHOD,
                  abi: pNetworkHubAbi,
                  contractAddress: this.adapterAddress,
                  value: 0n,
                },
                args,
              )
              .once('txBroadcasted', (_hash: string) => {
                promi.emit('txBroadcasted', { txHash: _hash })
              })
            const ret = {
              txHash: txReceipt.transactionHash.toString(),
              operationId: getOperationIdFromTransactionReceipt(this.networkId, txReceipt),
            }
            promi.emit('txConfirmed', ret)
            return resolve(ret)
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }

  protected settle(_operation: { blockId: number; txId: string; nonce: number; assetAddress: string; originChainId: ChainId; destinationChainId: ChainId; amount: bigint; sender: string; data: string }, _proof: { preimage: string; signature: string }): PromiEvent<any> {
    // TODO implement
  }
}
