import { HopApi } from "../index";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// @ts-ignore
async function txTest(): Promise<void> {
  const sui_client = new SuiClient({ url: getFullnodeUrl('mainnet') });
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "",
    fee_bps: 0,
    // fee_wallet: "0xa89611f02060bad390103e783a62c88725b47059e6460cf0d2f3ca32e2559641"
  });

  const total_balance = await sui_client.getBalance({
    owner: "0x90afb76a8bfca719dadb4e77de50f65bba5327397cc7550d9c7b816907958943",
    coinType: "0x71bd8693b1d17688e6671c9208e5e2499a95dce65ec690373002a72e6649f0e6::sure::SURE"
  });

  let amount_in = BigInt(total_balance.totalBalance);

  const quote_result = await api.fetchQuote({
    // @ts-ignore
    amount_in,
    token_out: "0x2::sui::SUI",
    token_in:
      "0x71bd8693b1d17688e6671c9208e5e2499a95dce65ec690373002a72e6649f0e6::sure::SURE",
  });

  console.log("amount_in", amount_in);
  console.log("quote_result.trade.amount_in", quote_result.trade.amount_in.amount);

  console.log("quote_result", quote_result);

  const tx_result = await api.fetchTx({
    // @ts-ignore
    trade: quote_result.trade,
    sui_address:
      "0x90afb76a8bfca719dadb4e77de50f65bba5327397cc7550d9c7b816907958943",
    return_output_coin_argument: false,
    // gas_budget: 1e7
    // max_slippage_bps: 100,
    // return_output_coin_argument: true,
    // base_transaction: tx,
    // input_coin_argument: coin,
  });

  // console.log("tx_result", tx_result);

  const result = await sui_client.dryRunTransactionBlock({ transactionBlock: await tx_result.transaction.build({ client: sui_client }) });
  // console.log("result", JSON.stringify(result, null, 2));
}

txTest();
