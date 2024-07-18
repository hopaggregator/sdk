import { HopApi } from "../index";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// @ts-ignore
async function txTest(): Promise<void> {
  const sui_client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "hopapisKX7I30wPvo5YfN8Vx5P9r4cPh3nzVcS",
    fee_bps: 10,
    fee_wallet: "0xa89611f02060bad390103e783a62c88725b47059e6460cf0d2f3ca32e2559641"
  });

  const quote_result = await api.fetchQuote({
    // @ts-ignore
    amount_in: 1_000_000_000n,
    token_in: "0x2::sui::SUI",
    token_out:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  });

  console.log("quote_result", quote_result);

  const tx_result = await api.fetchTx({
    // @ts-ignore
    trade: quote_result.trade,
    sui_address:
      "0x4466fe25550f648a4acd6823a90e1f96c77e1d37257ee3ed2d6e02a694984f73",
    max_slippage_bps: 100,
    // return_output_coin_argument: true,
    // base_transaction: tx,
    // input_coin_argument: coin,
  });

  const result = await sui_client.dryRunTransactionBlock({ transactionBlock: await tx_result.transaction.build({ client: sui_client }) });
  console.log("result", JSON.stringify(result, null, 2));
}

txTest();
