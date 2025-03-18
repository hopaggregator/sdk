import { HopApi } from "../index.js";
import { getFullnodeUrl } from "@mysten/sui/client";

// @ts-ignore
async function tokensTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "",
    fee_bps: 0
  });

  const result = await api.fetchTokens();

  console.log("result", result);
}

tokensTest();
