import { HopApi } from "../api.js";
import { makeAPIRequest } from "../util.js";
import { GammaQuote, gammaQuoteSchema } from "../types/quote.js";

export interface GetQuoteParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
}

export async function fetchQuote(
  client: HopApi,
  params: GetQuoteParams,
): Promise<GammaQuote | null> {
  return await makeAPIRequest({
    route: "swap",
    options: {
      hop_server_url: client.options.hop_server_url,
      data: {
        token_in: params.token_in,
        token_out: params.token_out,
        amount_in: params.amount_in.toString(),
      },
      method: "post",
    },
    responseSchema: gammaQuoteSchema,
  });
}
