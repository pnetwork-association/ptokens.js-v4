import PromiEvent from 'promievent'
import polling from 'light-async-polling'
import { Session, Checksum256, TransactResult } from "@wharfkit/session"
import { APIClient } from '@wharfkit/antelope'
import { pTokensAssetProvider } from 'ptokens-entities'
import { ContractKit } from '@wharfkit/contract'

const EOS_TRANSACTION_EXECUTED = 'executed'
const INIT_ERROR='Provider is not initialized. Use init() in order to initialize the provider'

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export type TransactOptions = {
  /** The method to be called. */
  actionName: string
  /** The table to query. */
  permission: string
  /** The contract address. */
  contractName: string
}

export class pTokensAntelopeProvider implements pTokensAssetProvider {
  private _client: APIClient
  private _session: Session
  private _chainId: Checksum256 | null
  private _contractKit: ContractKit

  /**
   * Create and initialize a pTokensEvmProvider object.
   * @param _url - An antelope rpc api url.
   * @param _session - A wharfkit session.
   */
  constructor(_url: string) {
    this._client = new APIClient({ url: _url })
    this._contractKit = new ContractKit({ client: this._client })
  }

  /**
   * Initializes the Provider by fetching the chainId.
   */
  async init() {
    if (this._chainId) throw Error('Provider already initialized')
    const providerChain = await this._client.v1.chain.get_info()
    if (!providerChain.chain_id) throw new Error('Provider could not retreive rpc chain info')
    this._chainId = providerChain.chain_id
  }

  /**
   * Return the provider chainId.
   */
  get chainId() {
    if (!this._chainId) 
      throw new Error(INIT_ERROR)
    return this._chainId
  }

  async blockId(blockNum: Number) {
    return await this._session.client.v1.chain.get_block(blockNum)
  }

  /**
   * Return the provider's session account.
   */
  async getAccount() {
    if (!this._session) throw new Error(`No session found`)
    return await this._session.account()
  }

  /**
   * Set a viem walletCLient creating and sending transactions.
   * @param _session - A wharfkit session.
   * @returns The same builder. This allows methods chaining.
   */
  async setSession(_session: Session): Promise<this> {
    if (!this._chainId) 
      throw new Error(INIT_ERROR)
    if (_session.chain?.id !== this._chainId)
      throw new Error(
        `Session chainId ${_session.chain?.id} does not match APIClient chainId ${this._chainId}`,
      )
    this._session = _session
    return this
  }

  /**
   * Wait for tx receipt.
   * @param _txHash - Transcation hash of the searched receipt.
   * @param _confirmations - Number of confirmations to wait.
   * @returns TransactionReceipt of _txHash.
   */
  async waitForTransactionConfirmation(_txHash: string, _pollingTime = 1000): Promise<any> {
    let response: UnwrapPromise<ReturnType<typeof this._client.v1.history.get_transaction>>
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await polling(async () => {
      try {
        response = await this._client.v1.history.get_transaction(_txHash)
        if (response && response.trx.receipt.status === EOS_TRANSACTION_EXECUTED) return true
        else return false
      } catch (err) {
        return false
      }
    }, _pollingTime)
    return response.id
  }

  getSwaps<T>(_adapterAddress: string, _fromBlock: bigint, _chunkSize: bigint): PromiEvent<T> {
    throw new Error('Method not implemented.')
  }

  /**
   * Call a “constant” method and execute its smart contract method in the EVM without sending any transaction.
   * Note calling cannot alter the smart contract state.
   * @param _options - An object specifying the contract interaction.
   * @param _args - The arguments to be passed to the contract method being called.
   * @returns A Promise that resolves with the return value(s) of the smart contract method.
   */
  transact<R, T extends {}>(
    _options: TransactOptions,
    _args: T | {},
  ) {
    const promi = new PromiEvent<TransactResult>(
      (resolve, reject) =>
        (async () => {
          try {
            if (!this._session) throw new Error('Session not provided')
            const { actionName, permission, contractName } = _options
            const contract = await this._contractKit.load(contractName)
            const action = contract.action(
              actionName,
              _args,
              {
                authorization: [{actor: this._session.actor, permission: permission,}]
              }
            )
            const result = await this._session.transact({ action })
            if (result.response && 'transaction_id' in result.response) {
              promi.emit('txBroadcasted', result.response.transaction_id)
              await this.waitForTransactionConfirmation(result.response.transaction_id)
              promi.emit('txConfirmed', result.response.transaction_id)
              return resolve(result.response.transaction_id)
            } else {
              return reject(new Error('Unexpected return value from transact()'))
            }
          } catch (_err) {
            return reject(_err)
          }
        })() as unknown,
    )
    return promi
  }

}
