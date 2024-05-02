import { HopApi } from "../api";

interface GetQuoteParams {}

interface GetQuoteResponse {}

function fetchQuote(client: HopApi, params: GetQuoteParams): GetQuoteResponse {
  return {};
}

export { GetQuoteParams, GetQuoteResponse, fetchQuote };
