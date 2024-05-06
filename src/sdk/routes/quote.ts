import { HopApi } from "../api";
import { getAmountOutWithCommission, makeRequest } from "../util";

interface GetQuoteParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
}

interface GetQuoteResponse {
  token_in: string;
  amount_in: bigint;
  token_out: string;
  amount_out: bigint;
  amount_out_with_fee: bigint;
}

async function fetchQuote(client: HopApi, params: GetQuoteParams): Promise<GetQuoteResponse | null> {
  let response = await makeRequest("quote", {
    hop_server_url: client.options.hop_server_url,
    api_key: client.options.api_key,
    data: {
      token_in: params.token_in,
      token_out: params.token_out,
      amount_in: params.amount_in.toString()
    },
    method: 'post'
  });

  if(response != null) {
    return {
      token_in: response.trade.amount_in.token,
      token_out: response.trade.amount_out.token,
      amount_in: BigInt(response.trade.amount_in.amount),
      amount_out: BigInt(response.trade.amount_out.amount),
      amount_out_with_fee: getAmountOutWithCommission(response.trade.amount_out.amount, client.options.fee_bps),
    };
  }

  return null;
}

export { GetQuoteParams, GetQuoteResponse, fetchQuote };
