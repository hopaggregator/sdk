import { HopApi } from "../api";
import { makeRequest } from "../util";

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
}

async function fetchQuote(client: HopApi, params: GetQuoteParams): Promise<GetQuoteResponse | null> {
  let data = await makeRequest("quote", {
    api_key: client.api_key,
    data: params as object,
    method: 'post'
  });

  if(data != null) {
    return {
      amount_in: data.amount_in,
      amount_out: data.amount_out,
      token_in: data.token_in,
      token_out: data.token_out
    };
  }

  return null;
}

export { GetQuoteParams, GetQuoteResponse, fetchQuote };
