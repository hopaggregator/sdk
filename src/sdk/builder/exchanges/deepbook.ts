import { SegmentBuildFn } from "../plan.js";
import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import { TransactionArgument } from "@mysten/sui/transactions";
import { SuiExchange } from "../../types/trade.js";

const SPONSORED_SWAPV3_PACKAGE_ID =
  "0xa77ab364e584d5099b5494cb20805f87763dd35f6900d40ed26b577f7a97a33a";
const SPONSORED_TOKENS_ID =
  "0xc7535ad2dcd01f08c470d821f96c7cce8ab266ecdee2df68b6d0f6657d7794a7";

export const buildDeepbookSegment: SegmentBuildFn<SuiExchange.DEEPBOOK> = (
  tx,
  segment,
  { coinIn, senderAddress },
) => {
  const baseToQuote =
    normalizeStructTag(segment.tokenFrom) ===
    normalizeStructTag(segment.data.baseAsset);

  let baseCoin: TransactionArgument;
  let quoteCoin: TransactionArgument;

  if (baseToQuote) {
    // here swap_exact_base_for_quote
    const [maybeBaseCoin, maybeQuoteCoin] = tx.moveCall({
      typeArguments: [segment.data.baseAsset, segment.data.quoteAsset],
      target: `${SPONSORED_SWAPV3_PACKAGE_ID}::sponsored_swap::swap_exact_base_for_quote_sponsored`,
      arguments: [
        tx.object(SPONSORED_TOKENS_ID), // sponsored tokens
        tx.object(segment.data.poolId), // pool id
        coinIn, // base in
        tx.pure.u64(0), // min amount out
        tx.object(SUI_CLOCK_OBJECT_ID), // clock
      ],
    });
    if (!maybeBaseCoin || !maybeQuoteCoin) {
      throw new Error("missing base/quote coin");
    }
    baseCoin = maybeBaseCoin;
    quoteCoin = maybeQuoteCoin;
  } else {
    // here swap_exact_quote_for_base
    const [maybeBaseCoin, maybeQuoteCoin] = tx.moveCall({
      typeArguments: [segment.data.baseAsset, segment.data.quoteAsset],
      target: `${SPONSORED_SWAPV3_PACKAGE_ID}::sponsored_swap::swap_exact_quote_for_base_sponsored`,
      arguments: [
        tx.object(SPONSORED_TOKENS_ID), // sponsored tokens
        tx.object(segment.data.poolId), // pool id
        coinIn, // base in
        tx.pure.u64(0), // min amount out
        tx.object(SUI_CLOCK_OBJECT_ID), // clock
      ],
    });
    if (!maybeBaseCoin || !maybeQuoteCoin) {
      throw new Error("missing base/quote coin");
    }
    baseCoin = maybeBaseCoin;
    quoteCoin = maybeQuoteCoin;
  }

  const outputCoin = baseToQuote ? quoteCoin : baseCoin;

  // send input coin back to sender
  tx.transferObjects([baseToQuote ? baseCoin : quoteCoin], senderAddress);

  return {
    outputCoin,
    isDangling: true,
  };
};
