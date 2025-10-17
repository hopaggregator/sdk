import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const MOVEPUMP_PACKAGE_ID =
  "0x638928d4cf7dd20a598e9d30d3626d61d94ffabee29bc7b861bef67d32110bb4";

// Shared objects
const MOVEPUMP_CONFIG_ID =
  "0xd746495d04a6119987c2b9334c5fefd7d8cff52a8a02a3ea4e3995b9a041ace4";
const MOVEPUMP_DEX_ID =
  "0x3f2d9f724f4a1ce5e71676448dc452be9a6243dac9c5b975a588c8c867066e92";

const HOP_FUN_PACKAGE_ID =
  "0xda79a03bd1cfcd082d713ee615dd7fe5f4574019ddad131466312fa5d1369077";

export const buildMovepumpSegment: SegmentBuildFn<SuiExchange.MOVEPUMP> = (
  tx,
  segment,
  { coinIn, minimumAmountOutForSegment, senderAddress },
) => {
  const is_buy = normalizeStructTag(segment.tokenFrom) == normalizeStructTag("0x2::sui::SUI");
  const min_out = minimumAmountOutForSegment || BigInt(0);

  if(is_buy) {
    const buy_arguments = [
      tx.object(MOVEPUMP_CONFIG_ID),
      coinIn,
      tx.object(MOVEPUMP_DEX_ID),
      tx.pure.u64(min_out),
      tx.object(SUI_CLOCK_OBJECT_ID)
    ];

    const [coin_sui, coin_token] = tx.moveCall({
      target: `${MOVEPUMP_PACKAGE_ID}::move_pump::buy_returns`,
      typeArguments: [segment.tokenTo],
      arguments: buy_arguments
    });

    tx.moveCall({
      target: `0xda79a03bd1cfcd082d713ee615dd7fe5f4574019ddad131466312fa5d1369077::meme::delete_or_return`,
      typeArguments: ["0x2::sui::SUI"],
      arguments: [coin_sui!, tx.pure.address(senderAddress)],
    });

    return {
      outputCoin: coin_token!,
      isDangling: true
    };
  } else {
    const sell_arguments = [
      tx.object(MOVEPUMP_CONFIG_ID),
      coinIn,
      tx.pure.u64(min_out),
      tx.object(SUI_CLOCK_OBJECT_ID)
    ];

    const [coin_sui, coin_token] = tx.moveCall({
      target: `${MOVEPUMP_PACKAGE_ID}::move_pump::sell_returns`,
      typeArguments: [segment.tokenTo],
      arguments: sell_arguments
    });

    tx.moveCall({
      target: `${HOP_FUN_PACKAGE_ID}::meme::delete_or_return`,
      typeArguments: [segment.tokenFrom],
      arguments: [coin_token!, tx.pure.address(senderAddress)],
    });

    return {
      outputCoin: coin_sui!,
      isDangling: true
    };
  }
};
