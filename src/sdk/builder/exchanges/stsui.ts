import { normalizeStructTag, SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const SPRING_SUI_PACKAGE_ID = "0x059f94b85c07eb74d2847f8255d8cc0a67c9a8dcc039eabf9f8b9e23a0de2700";

export const buildStsuiSegment: SegmentBuildFn<SuiExchange.STSUI> = (
  tx,
  segment,
  context,
) => {
  // direction of the swap
  const is_stake =
    normalizeStructTag(segment.tokenFrom) ===
    normalizeStructTag("0x2::sui::SUI");

  if (is_stake) {
    let mint_arguments = [
      tx.object(segment.data.poolId),
      tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
      context.coinIn
    ];

    const coin_token = tx.moveCall({
      target: `${SPRING_SUI_PACKAGE_ID}::liquid_staking::mint`,
      typeArguments: [segment.tokenTo],
      arguments: mint_arguments
    });

    return {
      outputCoin: coin_token,
      isDangling: true
    };
  } else {
    let unstake_arguments = [
      tx.object(segment.data.poolId),
      context.coinIn,
      tx.object(SUI_SYSTEM_STATE_OBJECT_ID)
    ];

    const sui_token = tx.moveCall({
      target: `${SPRING_SUI_PACKAGE_ID}::liquid_staking::redeem`,
      arguments: unstake_arguments,
      typeArguments: [segment.tokenFrom]
    });

    return {
      outputCoin: sui_token,
      isDangling: true
    }
  }
};
