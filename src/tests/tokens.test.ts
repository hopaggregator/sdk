import { HopApi } from "../index";
import { getFullnodeUrl } from "@mysten/sui.js/client";

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
