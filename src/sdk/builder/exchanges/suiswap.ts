import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const PACKAGE_ID =
  "0xb131952c7235fda0cf2a3ebebc94dc31d76a2fc1356c856c24253c51d5caa698";

export const buildSuiswapSegment: SegmentBuildFn<SuiExchange.SUISWAP> = (
  tx,
  segment,
  { coinIn },
) => {
  const method =
    normalizeStructTag(segment.tokenFrom) ===
    normalizeStructTag(segment.data.coinTypeX)
      ? "swap_x_to_y"
      : "swap_y_to_x";
  const inputCoinBalance = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn],
  });
  return {
    outputCoin: tx.moveCall({
      target: `${PACKAGE_ID}::suiswap::${method}`,
      typeArguments: [segment.data.coinTypeX, segment.data.coinTypeY],
      arguments: [
        tx.object(segment.data.poolId),
        tx.makeMoveVec({ elements: [coinIn] }),
        inputCoinBalance,
        tx.object(SUI_CLOCK_OBJECT_ID),
      ],
    }),
    isDangling: true,
  };
};
