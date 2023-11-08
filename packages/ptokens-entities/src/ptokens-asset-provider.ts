import PromiEvent from 'promievent'

export abstract class pTokensAssetProvider {
  /**
   * Wait for the confirmation of a transaction pushed on-chain.
   * @param _txHash - The hash of the transaction.
   * @param _pollingTime - The polling period.
   * @returns A Promise that resolve with the same transaction hash __txHash_.
   */
  abstract waitForTransactionConfirmation(_txHash: string): Promise<string>

  abstract monitorCrossChainOperations(_hubAddress: string, _operationId: string): PromiEvent<string>
}
