import { HopApi } from "../index.js";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// @ts-ignore
async function txTest(): Promise<void> {
  const sui_client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    fee_bps: 0n,
    hop_server_url: "http://localhost:3002/api/v1",
  });

  const quote_result = await api.fetchQuote({
    // @ts-ignore
    amount_in: 1e9,
    token_in: "0x2::sui::SUI",
    token_out:
      "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC",
  });

  console.log("quote_result", quote_result);

  const input_coins = await sui_client.getCoins({
    coinType: "0x2::sui::SUI",
    owner: "0xc2c058dea3872029ed0c0427c75b258747407a0a6a8209cd8c7a17630cfccd06"
  });

  const tx_result = api.buildTx({
    quote: quote_result!,
    sender_address: "0xc2c058dea3872029ed0c0427c75b258747407a0a6a8209cd8c7a17630cfccd06",
    max_slippage_bps: 1000n,
    user_input_coins: input_coins.data
  });

  console.log("tx_result", tx_result);
  tx_result.setSender("0xc2c058dea3872029ed0c0427c75b258747407a0a6a8209cd8c7a17630cfccd06");

  await sui_client.dryRunTransactionBlock({ transactionBlock: await tx_result.build({ client: sui_client }) });
}

txTest();