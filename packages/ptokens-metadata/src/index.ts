import axios from 'axios'
import { Metadata } from 'ptokens-entities'

export const getProofMetadata = async (_nodeUrl: string, _txId: string, _chain: string): Promise<Metadata> => {
  try {
    const { data } = await axios.post(
      _nodeUrl,
      {
        jsonrpc: '2.0',
        method: 'getSignedEvent',
        params: [_chain, _txId],
        id: 1,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (!data.result[0]) throw new Error('Data has been retrieved but no signature is available')
    return data.result[0] as Metadata
  } catch (_err) {
    throw _err
  }
}
