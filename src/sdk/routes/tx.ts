import { Transaction, Argument, TransactionResult } from "@mysten/sui/transactions";
import { CoinStruct } from "@mysten/sui/client";
import { HopApi } from "../api.js";
import { makeAPIRequest } from "../util.js";
import { compileRequestSchema, compileResponseSchema } from "../types/api.js";
import { Trade } from "../types/trade.js";
import { normalizeStructTag, toB64 } from "@mysten/sui/utils";

export interface GetTxParams {
  trade: Trade;
  sui_address: string;

  gas_budget?: number;
  max_slippage_bps?: number;

  /* FOR PTB USE */
  sponsored?: boolean;

  base_transaction?: Transaction;
  input_coin_argument?: Argument;
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
  let gas_coins: CoinId[] = [];
  let user_input_coins: InputToken[] = [];

  if(!params.input_coin_argument) {
     user_input_coins = await fetchCoins(
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
    if (total_input < params.trade.amount_in.amount) {
      throw new Error(
        `HopApi > Error: user does not have enough amount in for trade. 
      User amount: ${total_input}. 
      Trade amount: ${params.trade.amount_in.amount}`
      )
    }
  }

  // gas coins
  if(!params.sponsored) {
    if (normalizeStructTag(params.trade.amount_in.token) != normalizeStructTag("0x2::sui::SUI") || user_input_coins.length == 0) {
      let fetched_gas_coins = await fetchCoins(
        client,
        params.sui_address,
        "0x2::sui::SUI",
      );
      gas_coins = fetched_gas_coins.filter((struct) => Number(struct.amount) > 0).map((struct) => struct.object_id);
    } else {
      gas_coins = user_input_coins.filter((struct) => Number(struct.amount) > 0).map((struct) => struct.object_id);
    }
  }

  // add any input coins that match user type
  if(!params.input_coin_argument) {
    let single_output_coin: InputToken[] = await fetchCoins(
      client,
      params.sui_address,
      params.trade.amount_out.token,
      1,
    );
    user_input_coins.push(...single_output_coin);
  }

  if (!params.sponsored && gas_coins.length === 0) {
    throw new Error(
      `HopApi > Error: sui address ${params.sui_address} does not have any gas coins for tx.`,
    );
  }

  if(params.input_coin_argument && !params.base_transaction) {
    throw new Error("Input coin argument must be result from base transaction!");
  }

  let input_coin_argument = undefined;
  let input_coin_argument_nested = undefined;

  // @ts-expect-error
  if(params.input_coin_argument?.$kind === "Result" || params.input_coin_argument?.Result) {
    // @ts-expect-error
    input_coin_argument = params?.input_coin_argument?.Result;
    // @ts-expect-error
  } else if(params.input_coin_argument?.$kind === "NestedResult" || params.input_coin_argument?.NestedResult) {
    // @ts-expect-error
    input_coin_argument_nested = params?.input_coin_argument?.NestedResult;
  }

  let base_transaction = undefined;

  if(params.base_transaction) {
    const built_tx_array = await params.base_transaction.build({
      client: client.client,
      onlyTransactionKind: true
    });

    base_transaction = toB64(built_tx_array);
  }

  const compileRequest = compileRequestSchema.parse({
    trade: params.trade,
    builder_request: {
      sender_address: params.sui_address,
      user_input_coins,
      gas_coins,

      gas_budget: params.gas_budget ?? 2e8,
      max_slippage_bps: params.max_slippage_bps,

      api_fee_wallet: client.options.fee_wallet,
      api_fee_bps: client.options.fee_bps,

      sponsored: params.sponsored,
      base_transaction,

      input_coin_argument,
      input_coin_argument_nested,
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
      // @ts-ignore
      output_coin = tx_block
        .getData()
        .commands.find(
          (tx) =>
            tx.$kind == "MoveCall" &&
            tx.MoveCall.function === "check_slippage_v2" &&
            tx.MoveCall.module === "slippage",
        )?.MoveCall.arguments[0];
    }

    return {
      transaction: tx_block,
      output_coin,
    };
  }

  throw new Error("Could not construct transaction");
}

// const ensure_array = (value: number | number[]): number[] => {
//   if (typeof value == "number") {
//     return [value];
//   } else {
//     return value;
//   }
// }

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
    })
  );
};
