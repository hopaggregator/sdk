import { SUI_CLOCK_OBJECT_ID } from "@mysten/sui/utils";

import type { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const V2_PACKAGE_ID =
  "0xba153169476e8c3114962261d1edc70de5ad9781b83cc617ecc8c1923191cae0";
const V3_PACKAGE_ID =
  "0xcd83322a271ef764063a44fc079a7e349fb7b0744465d76e2f39c8bcf5708bd2";

const V3_POOL_REGISTRY =
  "0x27565d24a4cd51127ac90e4074a841bbe356cca7bf5759ddc14a975be1632abc";
const FLOWX_VERSIONED =
  "0x67624a1533b5aff5d0dfcf5e598684350efd38134d2d245f475524c03a64e656";

export const CONTAINER_OBJECT_ID =
  "0xb65dcbf63fd3ad5d0ebfbf334780dc9f785eff38a4459e37ab08fa79576ee511";

export const buildFlowxSegment: SegmentBuildFn<SuiExchange.FLOWX> = (
  tx,
  segment,
  { coinIn },
) => {
  if (segment.data.is_v3) {
    return {
      outputCoin: tx.moveCall({
        target: `${V3_PACKAGE_ID}::swap_router::swap_exact_input`,
        typeArguments: [segment.tokenFrom, segment.tokenTo],
        arguments: [
          tx.object(V3_POOL_REGISTRY),
          tx.pure.u64(segment.data.feeRate!),
          coinIn,
          tx.pure.u64(0),
          tx.pure.u128(0),
          tx.pure.u64("18446744073709551615"),
          tx.object(FLOWX_VERSIONED),
          tx.object(SUI_CLOCK_OBJECT_ID),
        ],
      }),
      isDangling: true,
    };
  } else {
    return {
      outputCoin: tx.moveCall({
        target: `${V2_PACKAGE_ID}::router::swap_exact_input_direct`,
        typeArguments: [segment.tokenFrom, segment.tokenTo],
        arguments: [tx.object(CONTAINER_OBJECT_ID), coinIn],
      }),
      isDangling: true,
    };
  }
};
