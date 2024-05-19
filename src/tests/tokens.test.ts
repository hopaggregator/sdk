import { HopApi } from "../index";
import { getFullnodeUrl } from "@mysten/sui.js/client";

// @ts-ignore
async function tokensTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "hopapisKX7I30wPvo5YfN8Vx5P9r4cPh3nzVcS",
    fee_bps: 0
  });

  const result = await api.fetchTokens();

  console.log("result", result);
}

tokensTest();
