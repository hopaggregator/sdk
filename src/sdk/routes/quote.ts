import { HopApi } from "../api.js";
import { swapAPIResponseSchema } from "../types/api.js";
import { Trade } from "../types/trade.js";
import { getAmountOutWithCommission, makeAPIRequest } from "../util.js";

export interface GetQuoteParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
}

export interface GetQuoteResponse {
  amount_out_with_fee: bigint;
  trade: Trade;
}

export async function fetchQuote(
  client: HopApi,
  params: GetQuoteParams,
): Promise<GetQuoteResponse> {
  const response = await makeAPIRequest({
    route: "quote",
    options: {
      api_key: client.options.api_key,
      hop_server_url: client.options.hop_server_url,
      data: {
        token_in: params.token_in,
        token_out: params.token_out,
        amount_in: params.amount_in.toString(),
      },
      method: "post",
    },
    responseSchema: swapAPIResponseSchema,
  });

  if (response?.trade) {
    return {
      amount_out_with_fee: getAmountOutWithCommission(
        response.trade.amount_out.amount,
        client.options.fee_bps,
      ),
      trade: response.trade,
    };
  }

  throw new Error("Unable to get quote");
}
