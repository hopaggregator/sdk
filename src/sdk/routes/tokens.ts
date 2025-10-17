// import { HopApi } from "../api.js";
// import { tokensResponseSchema } from "../types/api.js";
// import { makeAPIRequest } from "../util.js";
//
// export interface VerifiedToken {
//   coin_type: string;
//   name: string;
//   ticker: string;
//   icon_url: string;
//   decimals: number;
//   token_order?: number | null; // used for internal reasons
// }
//
// export interface GetTokensResponse {
//   tokens: VerifiedToken[];
// }
//
// export async function fetchTokens(client: HopApi): Promise<GetTokensResponse> {
//   const response = await makeAPIRequest({
//     route: "tokens",
//     options: {
//       api_key: client.options.api_key,
//       hop_server_url: client.options.hop_server_url,
//       data: {},
//       method: "post",
//     },
//     responseSchema: tokensResponseSchema,
//   });
//
//   if (response?.tokens) {
//     return {
//       tokens: response.tokens,
//     };
//   }
//
//   throw new Error("Unable to get tokens");
// }
