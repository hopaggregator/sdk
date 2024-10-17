import { HopApi } from "../api.js";
import { makeAPIRequest } from "../util.js";
import { priceResponseSchema } from "../types/api.js";

export interface GetPriceParams {
  coin_type: string;
}

export interface GetPriceResponse {
  coin_type: string;

  price_sui: number; // returns sui per token
  price_usd: number; // returns usd per token

  sui_price: number; // returns usdc per token
}

export async function fetchPrice(
  client: HopApi,
  params: GetPriceParams
): Promise<GetPriceResponse> {
  const response = await makeAPIRequest({
    route: `price`,
    options: {
      api_key: client.options.api_key,
      hop_server_url: client.options.hop_server_url,
      data: {
        coin_type: params.coin_type,
      },
      method: "post",
    },
    responseSchema: priceResponseSchema,
  });

  if (response?.coin_type) {
    let price_usd = response.price_sui * response.sui_price;

    return {
      coin_type: response?.coin_type,
      price_sui: response?.price_sui,
      price_usd,
      sui_price: response?.sui_price
    };
  }

  throw new Error("Unable to get price");

}