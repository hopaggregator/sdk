import axios from "axios";
import { API_SERVER_PREFIX, FEE_DENOMINATOR } from "./constants";

interface RequestParams {
  hop_server_url?: string,
  api_key: string,
  data: object,
  method: 'get' | 'post'
}

interface TokenAmount {
  token: string,
  amount: string
}

export interface Trade {
  amount_in: TokenAmount,
  amount_out: TokenAmount,
  nodes: any,
  edges: any
}

interface SwapAPIResponse {
  total_tests: number,
  errors: number,
  trade: Trade | null,
  tx: string | null
}

async function makeRequest(
  route: string,
  options: RequestParams
): Promise<SwapAPIResponse | null> {
  try {
    const response = await axios({
      method: options.method,
      url: `${options.hop_server_url || API_SERVER_PREFIX}/${route}`,
      data: {
        ...options.data,
        "api_key": options.api_key
      }
    });

    if(response.status != 200) {
      console.error(`HopApi > Error on request '/${route}' : ${response.statusText}`);
      return null;
    }

    return response.data as SwapAPIResponse;
  } catch(error) {
    console.error(error);
    console.error(`HopApi > Error on request '/${route}' : ${error.response.data}`);
  }

  return null;
}

function getAmountOutWithCommission(
  amount_out: string,
  fee_bps: number
): bigint {
  if(fee_bps == 0) {
    return BigInt(amount_out);
  }

  return BigInt(((BigInt(amount_out) * (FEE_DENOMINATOR - BigInt(fee_bps))) / BigInt(FEE_DENOMINATOR)).toString());
}

export {
  RequestParams,
  makeRequest,
  getAmountOutWithCommission
}