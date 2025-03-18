import { HopApi } from "../index.js";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// @ts-ignore
async function txTest(): Promise<void> {
  const sui_client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "",
    fee_bps: 30,
    hop_server_url: "http://localhost:3002/api/v2",
    charge_fees_in_sui: false,
  });

  const quote_result = await api.fetchQuote({
    // @ts-ignore
    amount_in: 1e9,
    token_in: "0x2::sui::SUI",
    token_out:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  });

  console.log("quote_result.trade.amount_in", quote_result.trade.quote);

  console.log("quote_result", quote_result);

  const tx_result = await api.fetchTx({
    // @ts-ignore
    trade: quote_result.trade,
    sui_address: "0x4466fe25550f648a4acd6823a90e1f96c77e1d37257ee3ed2d6e02a694984f73",
    // return_output_coin_argument: true,
    gas_budget: 100000000,
    max_slippage_bps: 1000
  });

  console.log("tx_result", tx_result);

  await sui_client.dryRunTransactionBlock({ transactionBlock: await tx_result.transaction.build({ client: sui_client }) });
  // console.log("result", JSON.stringify(result, null, 2));
}

txTest();
