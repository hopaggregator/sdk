import { HopApi } from "../api";

interface GetTxParams {}

interface GetTxResponse {}

function fetchTx(client: HopApi, params: GetTxParams): GetTxResponse {
  return {};
}

export { GetTxParams, GetTxResponse, fetchTx };
