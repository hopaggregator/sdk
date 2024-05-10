import { HopApi } from "../sdk/api";
import { getFullnodeUrl } from "@mysten/sui.js/client";

// @ts-ignore
async function txTest(): Promise<void> {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "",
    fee_bps: 0,
  });

  const quote_result = await api.fetchQuote({
    // @ts-ignore
    amount_in: 1_000_000_000n,
    token_in: "0x2::sui::SUI",
    token_out: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN"
  });

  console.log('quote_result', quote_result);

  const tx_result = await api.fetchTx({
    // @ts-ignore
    trade: quote_result.trade,
    sui_address:
      "0x4466fe25550f648a4acd6823a90e1f96c77e1d37257ee3ed2d6e02a694984f73",
    gas_budget: 1e6,
  });

  console.log("result", tx_result);
}

txTest();
