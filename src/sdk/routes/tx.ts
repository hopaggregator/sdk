import { HopApi } from "../api";

interface GetTxParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
  sui_address: string;
}

interface GetTxResponse {
  token_in: string;
  amount_in: bigint;
  token_out: string;
  amount_out: bigint;
}

function fetchTx(client: HopApi, params: GetTxParams): GetTxResponse {
  return { amount_in: 0n, amount_out: 0n, token_in: "", token_out: "" };
}

export { GetTxParams, GetTxResponse, fetchTx };
