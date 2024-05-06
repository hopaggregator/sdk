import axios from "axios";
import { API_SERVER_PREFIX, FEE_DENOMINATOR } from "./constants";

interface RequestParams {
  api_key: string,
  data: object,
  method: 'get' | 'post'
}

interface TokenAmount {
  token: string,
  amount: bigint
}

interface Trade {
  amount_in: TokenAmount,
  amount_out: TokenAmount
}

interface SwapAPIResponse {
  total_tests: bigint,
  errors: number,
  trade: Trade | null,
  tx: string | null
}

async function makeRequest(
  route: string,
  options: RequestParams
): Promise<SwapAPIResponse | null> {
  const response = await axios({
    method: options.method,
    url: `${API_SERVER_PREFIX}/${route}`,
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
}

function getAmountOutWithCommission(
  amount_out: bigint,
  fee_bps: number
): bigint {
  return BigInt((amount_out * (FEE_DENOMINATOR - BigInt(fee_bps))).toString(0));
}

export {
  RequestParams,
  makeRequest,
  getAmountOutWithCommission
}