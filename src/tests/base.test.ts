// @ts-ignore
import { HopApi } from "@hop.ag/sdk";
import {
  normalizeStructTag,
  normalizeSuiAddress,
  SUI_TYPE_ARG,
} from "@mysten/sui/utils";

import { getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";

async function baseTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "hopapisKX7I30wPvo5YfN8Vx5P9r4cPh3nzVcS",
    fee_bps: 0,
    // hop_server_url: "http://localhost:3002/api/v2",
  });

  const tx = new Transaction();
  const coinInType = SUI_TYPE_ARG;
  const address =
    "0xc23ea8e493616b1510d9405ce05593f8bd1fb30f44f92303ab2c54f6c8680ecb";
  const coinOutType =
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN";
  // @ts-ignore
  const coinInAmount = 100_000_000n;
  const coinIn = tx.splitCoins(tx.gas, [tx.pure.u64(coinInAmount)]);

  const result = await api.fetchQuote({
    // @ts-ignore
    amount_in: 1_000_000_000n,
    token_in: "0x2::sui::SUI",
    token_out:
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
  });

  // console.log(">> step 1 :: ", {
  //   tx,
  //   coinIn,
  //   address,
  //   coinInType,
  //   coinOutType,
  //   coinInAmount,
  // });

  const { trade } = await api.fetchQuote({
    amount_in: coinInAmount,
    token_in: normalizeStructTag(coinInType),
    token_out: normalizeStructTag(coinOutType),
  });

  tx.setSender(address);

  // console.log(">> step 2 :: ", trade);

  const response = await api.fetchTx({
    trade,
    sponsored: true,
    gas_budget: 1e8,
    base_transaction: tx,
    input_coin_argument: coinIn,
    // return_output_coin_argument: true,
    sui_address: normalizeSuiAddress(address),
  });

  console.log("result", response);
}

baseTest();