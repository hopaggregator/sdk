import { normalizeStructTag, SUI_SYSTEM_STATE_OBJECT_ID } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const SPRING_SUI_PACKAGE_ID = "0x82e6f4f75441eae97d2d5850f41a09d28c7b64a05b067d37748d471f43aaf3f7";

export const buildSpringsuiSegment: SegmentBuildFn<SuiExchange.SPRINGSUI> = (
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

    let weighthook_id = segment.data.weighthook_id;

    let rebalance_arguments = [
      tx.object(weighthook_id),
      tx.object(SUI_SYSTEM_STATE_OBJECT_ID),
      tx.object(segment.data.poolId)
    ];

    tx.moveCall({
      target: `${SPRING_SUI_PACKAGE_ID}::weight::rebalance`,
      typeArguments: [segment.tokenTo],
      arguments: rebalance_arguments
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

    // todo! check if we need rebalance on unstake

    return {
      outputCoin: sui_token,
      isDangling: true
    }
  }
};
