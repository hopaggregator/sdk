import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const TURBOSFUN_PACKAGE_ID =
  "0x96e1396c8a771c8ae404b86328dc27e7b66af39847a31926980c96dbc1096a15";

// Shared objects
const TURBOS_CONFIG_ID =
  "0xd86685fc3c3d989385b9311ef55bfc01653105670209ac4276ebb6c83d7df928";

const HOP_FUN_PACKAGE_ID =
  "0xda79a03bd1cfcd082d713ee615dd7fe5f4574019ddad131466312fa5d1369077";

export const buildTurbosfunSegment: SegmentBuildFn<SuiExchange.TURBOSFUN> = (
  tx,
  segment,
  { coinIn, minimumAmountOutForSegment, senderAddress },
) => {
  const is_buy = normalizeStructTag(segment.tokenFrom) == normalizeStructTag("0x2::sui::SUI");
  const min_out = minimumAmountOutForSegment || BigInt(0);

  if(is_buy) {
    const buy_arguments = [
      tx.object(TURBOS_CONFIG_ID),
      coinIn,
      tx.pure.u64(min_out),
      tx.pure.u64("18446744073709551615"),
      tx.pure.bool(false),
      tx.object(SUI_CLOCK_OBJECT_ID)
    ];

    const [coin_sui, coin_token] = tx.moveCall({
      target: `${TURBOSFUN_PACKAGE_ID}::turbospump::buy_with_return`,
      typeArguments: [segment.tokenTo],
      arguments: buy_arguments
    });

    tx.moveCall({
      target: `${HOP_FUN_PACKAGE_ID}::meme::delete_or_return`,
      typeArguments: ["0x2::sui::SUI"],
      arguments: [coin_sui!, tx.pure.address(senderAddress)],
    });

    return {
      outputCoin: coin_token!,
      isDangling: true
    };
  } else {
    const sui_sell_amount = tx.moveCall({
      target: "0x2::coin::value",
      typeArguments: [segment.tokenFrom],
      arguments: [coinIn]
    });

    const sell_arguments = [
      tx.object(TURBOS_CONFIG_ID),
      coinIn,
      sui_sell_amount,
      tx.pure.u64(0),
      tx.pure.bool(true),
      tx.object(SUI_CLOCK_OBJECT_ID)
    ];

    const [coin_sui, coin_token] = tx.moveCall({
      target: `${TURBOSFUN_PACKAGE_ID}::turbospump::sell_with_return`,
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
