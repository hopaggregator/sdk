import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CoinStruct } from "@mysten/sui.js/client";
import { HopApi } from "../api";
import { makeRequest } from "../util";

interface GetTxParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
  sui_address: string;
  gas_budget: number | 1e9;
}

interface GetTxResponse {
  token_in: string;
  amount_in: bigint;
  token_out: string;
  amount_out: bigint;
  transaction: TransactionBlock;
}

async function fetchTx(client: HopApi, params: GetTxParams): Promise<GetTxResponse | null> {
  let user_input_coins: CoinStruct[] = [];
  let cursor = null;

  // input coins
  do {
    let coin_response = await client.client.getCoins({
      owner: params.sui_address,
      cursor: cursor,
    });
    user_input_coins.push(...coin_response.data);

    if(coin_response.hasNextPage) {
      cursor = coin_response.nextCursor;
    } else {
      cursor = null;
    }
  } while(cursor != null);

  // gas coin
  let gas_coin = null;
  // TODO: build gas coin

  const response = await makeRequest('tx', {
    api_key: client.api_key,
    data: {
      amount_in: params.amount_in,
      token_in: params.token_in,
      token_out: params.token_out,
      builder_request: {
        sender_address: params.sui_address,
        user_input_coins,
        gas_coin,
        gas_budget: params.gas_budget
      }
    },
    method: 'post'
  });

  if(response != null) {
    const tx_block = TransactionBlock.from(response.tx);
    return {
      token_in: response.trade.amount_in.token,
      token_out: response.trade.amount_out.token,
      amount_in: response.trade.amount_in.amount,
      amount_out: response.trade.amount_out.amount,
      transaction: tx_block
    };
  }

  return null;
}

export { GetTxParams, GetTxResponse, fetchTx };
