import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const BLUEMOVE_PACKAGE_ID =
  "0x08cd33481587d4c4612865b164796d937df13747d8c763b8a178c87e3244498f";

const DEX_INFO_OBJECT_ID =
  "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92";

export const buildBluemoveSegment: SegmentBuildFn<SuiExchange.BLUEMOVE> = (
  tx,
  segment,
  { coinIn },
) => {
  const inputCoinBalance = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn],
  });
  return {
    outputCoin: tx.moveCall({
      target: `${BLUEMOVE_PACKAGE_ID}::router::swap_exact_input_`,
      typeArguments: [segment.tokenFrom, segment.tokenTo],
      arguments: [
        inputCoinBalance,
        coinIn,
        tx.pure.u64(0),
        tx.object(DEX_INFO_OBJECT_ID),
      ],
    }),
    isDangling: true,
  };
};
