import { TransactionBlock } from "@mysten/sui.js/transactions";
import { CoinStruct } from "@mysten/sui.js/client";
import { HopApi } from "../api";
import { getAmountOutWithCommission, makeRequest } from "../util";

interface GetTxParams {
  token_in: string;
  token_out: string;
  amount_in: bigint;
  sui_address: string;
  gas_budget?: number;
}

interface GetTxResponse {
  token_in: string;
  amount_in: bigint;
  token_out: string;
  amount_out: bigint;
  amount_out_with_fee: bigint;
  transaction: TransactionBlock;
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
    },
    coin_type: coin_struct.coinType,
    amount: coin_struct.balance,
  }));
}

async function fetchTx(
  client: HopApi,
  params: GetTxParams,
): Promise<GetTxResponse | null> {
  // get input coins
  let user_input_coins: InputToken[] = await fetchCoins(
    client,
    params.sui_address,
    params.token_in,
  );
  // add any input coins that match user type
  let single_output_coin: InputToken[] = await fetchCoins(
    client,
    params.sui_address,
    params.token_out,
    1,
  );
  user_input_coins.push(...single_output_coin);

  // gas coins
  let gas_coins: CoinId[];
  if (params.token_in != "0x2::sui::SUI") {
    let fetched_gas_coins = await fetchCoins(
      client,
      params.sui_address,
      "0x2:sui::SUI",
    );
    gas_coins = fetched_gas_coins.map((struct) => struct.object_id);
  } else {
    gas_coins = user_input_coins.map((struct) => struct.object_id);
  }

  const response = await makeRequest("tx", {
    hop_server_url: client.options.hop_server_url,
    api_key: client.options.api_key,
    data: {
      amount_in: params.amount_in.toString(),
      token_in: params.token_in,
      token_out: params.token_out,
      builder_request: {
        sender_address: params.sui_address,
        user_input_coins,
        gas_coins,
        gas_budget: params.gas_budget | 1e9,
      },
    },
    method: "post",
  });

  if (response != null) {
    const tx_block = createFrontendTxBlock(response.tx);
    console.log(tx_block.serialize());
    return {
      token_in: response.trade.amount_in.token,
      token_out: response.trade.amount_out.token,
      amount_in: BigInt(response.trade.amount_in.amount),
      amount_out: BigInt(response.trade.amount_out.amount),
      amount_out_with_fee: getAmountOutWithCommission(
        response.trade.amount_out.amount,
        client.options.fee_bps,
      ),
      transaction: tx_block,
    };
  }

  return null;
}

const createFrontendTxBlock = (serialized: string): TransactionBlock => {
  const txb = TransactionBlock.from(serialized);
  const newInputs = txb.blockData.inputs.map((input) => {
    if (input.type === "object") {
      const objectId =
        input.value?.Object?.Shared?.objectId ??
        input.value?.Object?.ImmOrOwned?.objectId;
      if (!objectId) {
        throw new Error(`Missing object ID for input ${input.index}`);
      }
      return {
        ...input,
        value: objectId,
      };
    }
    return input;
  });
  return TransactionBlock.from(
    JSON.stringify({
      ...txb.blockData,
      gasConfig: {},
      inputs: newInputs,
    }),
  );
};

export { GetTxParams, GetTxResponse, fetchTx };
