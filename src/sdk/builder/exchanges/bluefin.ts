import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import type { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const BLUEFIN_PACKAGE_ID =
  "0x67b34b728c4e28e704dcfecf7c5cf55c7fc593b6c65c20d1836d97c209c1928a";

const BLUEFIN_CONFIG_OBJECT_ID =
  "0x03db251ba509a8d5d8777b6338836082335d93eecbdd09a11e190a1cff51c352";

const HOP_UTIL_PACKAGE_ID =
  "0x443a2a89398758f915b021f4d5d95ff87b2dafd8db9b6681e323f1e4a814a62b";

export const buildBluefinSegment: SegmentBuildFn<SuiExchange.BLUEFIN> = (
  tx,
  segment,
  { coinIn, senderAddress },
) => {
  const a2b = segment.data.coinTypeA === segment.tokenFrom;

  let input_balance_a;
  let input_balance_b;

  if (a2b) {
    input_balance_a = tx.moveCall({
      target: "0x2::coin::into_balance",
      typeArguments: [segment.tokenFrom],
      arguments: [coinIn],
    });

    input_balance_b = tx.moveCall({
      target: "0x2::balance::zero",
      typeArguments: [segment.tokenTo],
    });
  } else {
    input_balance_a = tx.moveCall({
      target: "0x2::balance::zero",
      typeArguments: [segment.tokenTo],
    });

    input_balance_b = tx.moveCall({
      target: "0x2::coin::into_balance",
      typeArguments: [segment.tokenFrom],
      arguments: [coinIn],
    });
  }

  const input_value = tx.moveCall({
    target: "0x2::balance::value",
    typeArguments: [segment.tokenFrom],
    arguments: [a2b ? input_balance_a : input_balance_b],
  });

  const [balance_a, balance_b] = tx.moveCall({
    target: `${BLUEFIN_PACKAGE_ID}::pool::swap`,
    typeArguments: [segment.data.coinTypeA, segment.data.coinTypeB],
    arguments: [
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(BLUEFIN_CONFIG_OBJECT_ID),
      tx.object(segment.data.poolId),
      input_balance_a,
      input_balance_b,
      tx.pure.bool(a2b),
      tx.pure.bool(true),
      input_value,
      tx.pure.u64(0),
      tx.pure.u128(a2b ? "4295048017" : "79226673515401279992447579054"), // MAX sqrt price limit
    ],
  });

  let output_balance;
  let remainder_balance;

  if (a2b) {
    output_balance = balance_b;
    remainder_balance = balance_a;
  } else {
    output_balance = balance_a;
    remainder_balance = balance_b;
  }

  const remainder_coin = tx.moveCall({
    target: "0x2::coin::from_balance",
    typeArguments: [segment.tokenFrom],
    arguments: [remainder_balance!],
  });

  tx.moveCall({
    target: `${HOP_UTIL_PACKAGE_ID}::utils::transfer_or_destroy_zero`,
    typeArguments: [segment.tokenFrom],
    arguments: [remainder_coin, tx.pure.address(senderAddress)],
  });

  const output_coin = tx.moveCall({
    target: "0x2::coin::from_balance",
    typeArguments: [segment.tokenTo],
    arguments: [output_balance!],
  });

  return {
    outputCoin: output_coin,
    isDangling: true,
  };
};
