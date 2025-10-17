import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

// v2
const KRIYA_V2_PACKAGE_ID =
  "0xa0eba10b173538c8fecca1dff298e488402cc9ff374f8a12ca7758eebe830b66";

// v3
const KRIYA_V3_PACKAGE_ID =
  "0xbd8d4489782042c6fafad4de4bc6a5e0b84a43c6c00647ffd7062d1e2bb7549e";
const KRIYA_V3_VERSION_ID =
  "0xf5145a7ac345ca8736cf8c76047d00d6d378f30e81be6f6eb557184d9de93c78";

export const buildKriyaSegment: SegmentBuildFn<SuiExchange.KRIYA> = (
  tx,
  segment,
  context,
) => {
  // direction of the swap
  const x2y: boolean =
    segment.data.coinTypeX === normalizeStructTag(segment.tokenFrom);

  const inputCoinAmount = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [segment.tokenFrom],
    arguments: [context.coinIn],
  });

  if (!segment.data.is_v3) {
    const functionName = x2y ? "swap_token_x" : "swap_token_y";

    const args = [
      tx.object(segment.data.poolId),
      context.coinIn,
      // amount: when by_amount_in equals true, amount means the quantity of input coin, when by_amount_in equals false, amount means the quantity of output coin.
      inputCoinAmount,
      tx.pure.u64(0),
    ];

    return {
      outputCoin: tx.moveCall({
        target: `${KRIYA_V2_PACKAGE_ID}::spot_dex::${functionName}`,
        typeArguments: [segment.data.coinTypeX, segment.data.coinTypeY],
        arguments: args,
      }),
      isDangling: true,
    };
  } else {
    const LowLimitPrice = 4295048017;
    const limitPrice = BigInt("79226673515401279992447579050");

    const [receive_a, receive_b, flash_receipt] = tx.moveCall({
      target: `${KRIYA_V3_PACKAGE_ID}::trade::flash_swap`,
      typeArguments: [segment.data.coinTypeX, segment.data.coinTypeY],
      arguments: [
        tx.object(segment.data.poolId),
        tx.pure.bool(x2y),
        tx.pure.bool(true),
        inputCoinAmount,
        tx.pure.u128(x2y ? LowLimitPrice : limitPrice),
        tx.object(SUI_CLOCK_OBJECT_ID),
        tx.object(KRIYA_V3_VERSION_ID),
      ],
    });

    tx.moveCall({
      target: `0x2::balance::destroy_zero`,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      arguments: [x2y ? receive_a! : receive_b!],
      typeArguments: [x2y ? segment.data.coinTypeX : segment.data.coinTypeY],
    });

    const [zeroCoin] = tx.moveCall({
      target: `0x2::balance::zero`,
      typeArguments: [x2y ? segment.data.coinTypeY : segment.data.coinTypeX],
      arguments: [],
    });

    const inputCoinBalance = tx.moveCall({
      target: `0x2::coin::into_balance`,
      typeArguments: [segment.tokenFrom],
      arguments: [context.coinIn],
    });
    const pay_coin_a = x2y ? inputCoinBalance : zeroCoin;
    const pay_coin_b = x2y ? zeroCoin : inputCoinBalance;
    tx.moveCall({
      target: `${KRIYA_V3_PACKAGE_ID}::trade::repay_flash_swap`,
      typeArguments: [segment.data.coinTypeX, segment.data.coinTypeY],
      arguments: [
        tx.object(segment.data.poolId),
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        flash_receipt!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pay_coin_a!,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pay_coin_b!,
        tx.object(KRIYA_V3_VERSION_ID),
      ],
    });
    const outputCoin = tx.moveCall({
      target: `0x2::coin::from_balance`,
      typeArguments: [x2y ? segment.data.coinTypeY : segment.data.coinTypeX],
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      arguments: [x2y ? receive_b! : receive_a!],
    });

    return {
      outputCoin,
      isDangling: true,
    };
  }
};
