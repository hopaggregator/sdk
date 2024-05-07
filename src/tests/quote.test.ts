import { HopApi } from "../sdk/api";
import { getFullnodeUrl } from "@mysten/sui.js/client";

async function quoteTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "hopapisKX7I30wPvo5YfN8Vx5P9r4cPh3nzVcS",
    fee_bps: 0,
    hop_server_url: "http://localhost:3002/api/v2"
  });

  const result = await api.fetchQuote({
    amount_in: 1_000_000_000n,
    token_in: "0x2::sui::SUI",
    token_out: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"
  });

  console.log('result', result);
}

quoteTest()