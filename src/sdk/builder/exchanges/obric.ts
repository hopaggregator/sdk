import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const OBRIC_PACKAGE_ID = "0xb84e63d22ea4822a0a333c250e790f69bf5c2ef0c63f4e120e05a6415991368f";

const PYTH_STATE_SHARED_OBJECT_ID = "0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8";
const PYTH_SUI_PRICE_OBJECT_ID = "0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37";
const PYTH_USDC_PRICE_OBJECT_ID = "0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab";

export const buildObricSegment: SegmentBuildFn<SuiExchange.OBRIC> = (
  tx,
  segment,
  context,
) => {
  // we only have two SUI / USDC pools
  let a2b = normalizeStructTag("0x2::sui::SUI") == normalizeStructTag(segment.tokenFrom);
  let function_name = "";
  let args = [];

  if(a2b) {
    function_name = "swap_x_to_y";
    args = [
      tx.object(segment.data.poolId),
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(PYTH_STATE_SHARED_OBJECT_ID),
      tx.object(PYTH_SUI_PRICE_OBJECT_ID),
      tx.object(PYTH_USDC_PRICE_OBJECT_ID),
      context.coinIn
    ];
  } else {
    function_name = "swap_y_to_x";
    args = [
      tx.object(segment.data.poolId),
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(PYTH_STATE_SHARED_OBJECT_ID),
      tx.object(PYTH_USDC_PRICE_OBJECT_ID),
      tx.object(PYTH_SUI_PRICE_OBJECT_ID),
      context.coinIn
    ];
  }

  return {
    outputCoin: tx.moveCall({
      target: `${OBRIC_PACKAGE_ID}::v2::${function_name}`,
      typeArguments: [
        normalizeStructTag("0x2::sui::SUI"),
        normalizeStructTag("0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC")
      ],
      arguments: args,
    }),
    isDangling: true
  };
};