import { HopApi } from "../api";

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

async function fetchQuote(client: HopApi, params: GetQuoteParams): Promise<GetQuoteResponse> {
  return {
    amount_in: 0n,
    token_in: "",
    token_out: "",
    amount_out: 0n,
  };
}

export { GetQuoteParams, GetQuoteResponse, fetchQuote };
