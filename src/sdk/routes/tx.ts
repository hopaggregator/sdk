import { Transaction, TransactionResult } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { HopApi } from "../api.js";
import { makeAPIRequest } from "../util.js";
import { compileRequestSchema, compileResponseSchema } from "../types/api.js";
import { Trade } from "../types/trade.js";

export interface GetTxParams {
  trade: Trade;
  sui_address: string;

  gas_budget?: number;
  max_slippage_bps?: number;

  /* FOR PTB USE */
  return_output_coin_argument?: boolean;
}

export interface GetTxResponse {
  transaction: Transaction;
  output_coin: TransactionResult | undefined;
}

interface CoinId {
  object_id: string;
  version: string;
}

interface InputToken {
  object_id: CoinId;
  coin_type: string;
  amount: string;
}

async function fetchCoins(
  client: HopApi,
  sui_address: string,
  coin_type: string,
  max = -1,
): Promise<InputToken[]> {
  let coins: CoinStruct[] = [];
  let cursor = null;

  do {
    let coin_response = await client.client.getCoins({
      owner: sui_address,
      coinType: coin_type,
      cursor: cursor,
    });
    coins.push(...coin_response.data);

    // if you only want x coins
    if (max != -1 && coins.length >= max) {
      break;
    }

    if (coin_response.hasNextPage) {
      cursor = coin_response.nextCursor;
    } else {
      cursor = null;
    }
  } while (cursor != null);

  return coins.map((coin_struct) => ({
    object_id: {
      object_id: coin_struct.coinObjectId,
      version: coin_struct.version,
      digest: coin_struct.digest,
    },
    coin_type: coin_struct.coinType,
    amount: coin_struct.balance,
  }));
}

export async function fetchTx(
  client: HopApi,
  params: GetTxParams,
): Promise<GetTxResponse> {
  // get input coins
  let user_input_coins: InputToken[] = await fetchCoins(
    client,
    params.sui_address,
    params.trade.amount_in.token,
  );
  if (user_input_coins.length == 0) {
    throw new Error(
      `HopApi > Error: sui address ${params.sui_address} does not have any input coins for tx.`,
    );
  }
  let total_input = user_input_coins.reduce((c, t) => c + BigInt(t.amount), 0n);
  if(total_input < params.trade.amount_in.amount) {
    throw new Error(
      `HopApi > Error: user does not have enough amount in for trade. 
      User amount: ${total_input}. 
      Trade amount: ${params.trade.amount_in.amount}`
    )
  }

  // gas coins
  let gas_coins: CoinId[];
  if (params.trade.amount_in.token != "0x2::sui::SUI") {
    let fetched_gas_coins = await fetchCoins(
      client,
      params.sui_address,
      "0x2::sui::SUI",
    );
    gas_coins = fetched_gas_coins.filter((struct) => struct.amount != "0").map((struct) => struct.object_id);
  } else {
    gas_coins = user_input_coins.filter((struct) => struct.amount != "0").map((struct) => struct.object_id);
  }

  // add any input coins that match user type
  let single_output_coin: InputToken[] = await fetchCoins(
    client,
    params.sui_address,
    params.trade.amount_out.token,
    1,
  );
  user_input_coins.push(...single_output_coin);

  if (gas_coins.length === 0) {
    throw new Error(
      `HopApi > Error: sui address ${params.sui_address} does not have any gas coins for tx.`,
    );
  }

  const compileRequest = compileRequestSchema.parse({
    trade: params.trade,
    builder_request: {
      sender_address: params.sui_address,
      user_input_coins,
      gas_coins,

      gas_budget: params.gas_budget ?? 1e8,
      max_slippage_bps: params.max_slippage_bps,

      api_fee_wallet: client.options.fee_wallet,
      api_fee_bps: client.options.fee_bps,

      return_output_coin_argument: !!params.return_output_coin_argument,
    },
  });

  const response = await makeAPIRequest({
    route: "tx/compile",
    options: {
      api_key: client.options.api_key,
      hop_server_url: client.options.hop_server_url,
      data: compileRequest,
      method: "post",
    },
    responseSchema: compileResponseSchema,
  });

  if (response.tx) {
    const tx_block = createFrontendTxBlock(response.tx);
    let output_coin: TransactionResult | undefined = undefined;

    if(params.return_output_coin_argument) {
      // order
      // last merge into final output coin
      // slippage check
      // fee
      if(client.options.fee_wallet != undefined) {
        // @ts-ignore
        output_coin = tx_block.blockData.transactions.find((tx) => {
          return tx.kind == 'MoveCall' && tx.target.endsWith('slippage::check_slippage_v2');
          // @ts-ignore
        })?.arguments[0];
      } else {
        throw new Error("Fees must be enabled for output coin to be returned!");
      }
    }

    return {
      transaction: tx_block,
      output_coin,
    };
  }

  throw new Error("Could not construct transaction");
}

const createFrontendTxBlock = (serialized: string): Transaction => {
  const txb = Transaction.from(serialized);
  const inputs = txb.getData().inputs;

  const newInputs = inputs.map((input) => {
    if (input.$kind === "Object") {
      const objectId =
        input.Object?.SharedObject?.objectId ??
        input.Object?.ImmOrOwnedObject?.objectId;
      if (!objectId) {
        throw new Error(`Missing object ID for input ${input.$kind}`);
      }

      return {
        $kind: "UnresolvedObject",
        UnresolvedObject: {
          objectId,
        }
      }
    }
    return input;
  });

  return Transaction.from(
    JSON.stringify({
      ...txb.getData(),
      gasConfig: {},
      inputs: newInputs,
    }),
  );
};
