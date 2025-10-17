import type { CoinStruct } from "@mysten/sui/client";
import type { TransactionObjectArgument } from "@mysten/sui/transactions";
import { Transaction } from "@mysten/sui/transactions";
import { normalizeStructTag, parseStructTag } from "@mysten/sui/utils";

import { buildCoinForAmount, isSuiCoin, isUSDCCoin } from "./coinUtils.js";
import type { SegmentContext, SwapPlanSegment } from "./plan.js";
import { getBuilder } from "./plan.js";
import { GammaQuote, Hop } from "../types/quote.js";
import { HOP_AG_FEE_ADDRESS } from "../constants.js";
import { SuiExchange } from "../types/trade.js";
import { HOP_FUN_PACKAGE_ID } from "./exchanges/momentum.js";

// todo! trade builder
// iterate over each start of each hop
// split the initial coin into those pools
// then perform the buil segments with those coins
// then merge the output coins back togehter

export class TradeBuilder {
  private quote: GammaQuote;
  private fee_bps: bigint;

  constructor(
    quote: GammaQuote,
    fee_bps: bigint,
  ) {
    this.quote = quote;
    this.fee_bps = fee_bps;
  }

  minimumAmountOut(max_slippage_bps: bigint): bigint {
    return BigInt(this.quote!.amount_out) * max_slippage_bps / 10_000n
  }

  compileToTX = ({
    senderAddress,
    userInputCoins,
    maxSlippageBps,
  }: {
    senderAddress: string;
    userInputCoins: CoinStruct[];
    maxSlippageBps: bigint;
  }): Transaction => {
    const tx = new Transaction();

    const outputCoins: TransactionObjectArgument[] = [];
    const initialInputCoin = buildCoinForAmount(
      tx,
      userInputCoins,
      BigInt(this.quote.amount_in),
      this.quote.coin_in
    ).targetCoin;
    let fee_charged = false;

    if(maxSlippageBps > 0 && !(isSuiCoin(this.quote.coin_out) || isUSDCCoin(this.quote.coin_out))) {
      let fee_amount = BigInt(this.quote.amount_out) * this.fee_bps / 10_000n;
      let fee_coin = tx.splitCoins(initialInputCoin, [fee_amount]);
      tx.transferObjects([fee_coin], HOP_AG_FEE_ADDRESS);
      fee_charged = true;
    }

    let inputCoins;

    if(this.quote.routes.length > 1) {
      inputCoins = tx.splitCoins(initialInputCoin, this.quote.routes.map((route) => BigInt(route.amount_in)));
      tx.moveCall({
        target: `${HOP_FUN_PACKAGE_ID}::meme::delete_or_return`,
        typeArguments: [this.quote.coin_in],
        arguments: [initialInputCoin!, tx.pure.address(senderAddress)],
      });
    } else {
      inputCoins = [initialInputCoin];
    }

    for(let rIndex = 0; rIndex < this.quote.routes.length; rIndex++) {
      const route = this.quote.routes[rIndex]!;
      const inputCoin: TransactionObjectArgument = inputCoins[rIndex]!;

      let nextInputCoin = inputCoin;

      for(let i = 0; i < route.hops.length; i++) {
        const node = route.hops[i]!;

        const ctx = {
          coinIn: nextInputCoin,
          senderAddress,
          minimumAmountOutForSegment: undefined,
        } satisfies SegmentContext;
        const builder = getBuilder(node.exchange);
        const data = createSegmentData(node);
        // @ts-ignore
        const buildResult = builder(tx, {
          suiExchange: node.exchange,
          tokenFrom: node.from,
          tokenTo: node.to,
          data
        }, ctx);
        nextInputCoin = buildResult.outputCoin!;
      }

      outputCoins.push(nextInputCoin);
    }

    const minimumAmountOut = this.minimumAmountOut(maxSlippageBps);
    const firstOutputCoin = outputCoins[0];

    if (firstOutputCoin) {
      // If more than one output coin, merge
      if (outputCoins.length > 1) {
        tx.mergeCoins(firstOutputCoin, outputCoins.slice(1));
      }

      if(this.fee_bps > 0 && !fee_charged) {
        // charge fee here
        tx.moveCall({
          target: "0x443a2a89398758f915b021f4d5d95ff87b2dafd8db9b6681e323f1e4a814a62b::api::take_commission_partner",
          typeArguments:[
            this.quote.coin_out
          ],
          arguments: [
            firstOutputCoin,
            tx.pure.address(HOP_AG_FEE_ADDRESS),
            tx.pure.u64(this.fee_bps),
          ]
        });
      }

      // Minimum amount out check
      // https://github.com/hopaggregator/hop-util/blob/main/sources/slippage.move
      tx.moveCall({
        target:
          "0x5d32d749705c5f07c741f1818df3db466128bf01677611a959b03040ac5dc774::slippage::check_slippage_v2",
        typeArguments: [
          this.quote.coin_in,
          this.quote.coin_out,
        ],
        arguments: [
          firstOutputCoin,
          tx.pure.u64(minimumAmountOut),
          tx.pure.u64(BigInt(this.quote.amount_in)),
        ],
      });
      const userOutputCoin = userInputCoins.find((coin) =>
        normalizeStructTag(this.quote.coin_out) === normalizeStructTag(coin.coinType),
      );

      if (
        userOutputCoin &&
        // can't merge back into the gas object
        !isSuiCoin(userOutputCoin.coinType)
      ) {
        tx.mergeCoins(tx.object(userOutputCoin.coinObjectId), [
          firstOutputCoin,
        ]);
      } else {
        tx.transferObjects([firstOutputCoin], senderAddress);
      }
    }

    return tx;
  };
}

const createSegmentData = (node: Hop): SwapPlanSegment["data"] => {
  switch (node.exchange) {
    case SuiExchange.HOPFUN: {
      return {
        poolId: node.pool_id,
      };
    }
    case SuiExchange.BLUEFIN: {
      const [coinTypeA, coinTypeB] = [
        normalizeStructTag(node.tokens[0]!),
        normalizeStructTag(node.tokens[1]!),
      ];

      return {
        poolId: node.pool_id,
        coinTypeA,
        coinTypeB,
      };
    }
    case SuiExchange.CETUS: {
      const [coinTypeA, coinTypeB] = [
        normalizeStructTag(node.tokens[0]!),
        normalizeStructTag(node.tokens[1]!),
      ];
      return {
        poolId: node.pool_id,
        coinTypeA,
        coinTypeB,
      };
    }
    case SuiExchange.MOMENTUM: {
      const [coinTypeA, coinTypeB] = [
        normalizeStructTag(node.tokens[0]!),
        normalizeStructTag(node.tokens[1]!)
      ];

      return {
        poolId: node.pool_id,
        coinTypeA,
        coinTypeB
      }
    }
    case SuiExchange.KRIYA: {
      const [coinTypeX, coinTypeY] = [
        normalizeStructTag(node.tokens[0]!),
        normalizeStructTag(node.tokens[1]!),
      ];
      return {
        poolId: node.pool_id,
        coinTypeX,
        coinTypeY,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error error
        is_v3: !!pool.extra?.KRIYA?.is_v3,
      };
    }
    case SuiExchange.AFTERMATH: {
      if (!node.extra || !("AFTERMATH" in node.extra)) {
        throw new Error("missing aftermath data");
      }
      return {
        poolId: node.pool_id,
        // @ts-ignore
        lpCoinType: node.extra.AFTERMATH.lp_coin_type!,
        expectedAmountOut: BigInt(node.expected_amount_out),
      };
    }
    case SuiExchange.FLOWX:
      if (!node.extra || !("FLOWX" in node.extra)) {
        throw new Error("missing flowx data");
      }

      return {
        poolId: node.pool_id,
        // @ts-ignore
        is_v3: node.extra.FLOWX.is_v3!,
        coinTypeA: node.tokens[0],
        coinTypeB: node.tokens[1]!,
        // @ts-ignore
        feeRate: node.extra.FLOWX.fee_rate,
      };
    case SuiExchange.BLUEMOVE: {
      return {
        poolId: node.pool_id
      };
    }
    case SuiExchange.TURBOS: {
      if (!node.extra || !("TURBOS" in node.extra)) {
        throw new Error("missing turbos data");
      }
      return {
        poolId: node.pool_id,
        // @ts-ignore
        coinTypeA: node.extra.TURBOS.coin_type_a!,
        // @ts-ignore
        coinTypeB: node.extra.TURBOS.coin_type_b!,
        // @ts-ignore
        feeType: node.extra.TURBOS.fee_type!,
        // @ts-ignore
        tick_spacing: node.extra.TURBOS.tick_spacing!,
        // @ts-ignore
        tick_current_index: node.extra.TURBOS.tick_current_index!,
      };
    }
    case SuiExchange.DEEPBOOK: {
      if (!node.extra || !("DEEPBOOK" in node.extra)) {
        throw new Error("missing deepbook data");
      }
      // @ts-ignore
      const poolType = parseStructTag(node.extra.DEEPBOOK.pool_type!);

      return {
        poolId: node.pool_id,
        // @ts-ignore
        baseAsset: normalizeStructTag(poolType.typeParams[0]),
        // @ts-ignore
        quoteAsset: normalizeStructTag(poolType.typeParams[1]),
        // @ts-ignore
        lotSize: node.extra.DEEPBOOK.lot_size!,
        // @ts-ignore
        minSize: node.extra.DEEPBOOK.min_size!,
      };
    }
    case SuiExchange.SUISWAP: {
      return {
        poolId: node.pool_id,
        coinTypeX: normalizeStructTag(node.tokens[0]!),
        coinTypeY: normalizeStructTag(node.tokens[1]!),
      };
    }
    case SuiExchange.MOVEPUMP: {
      return {
        poolId: node.pool_id
      }
    }
    case SuiExchange.TURBOSFUN: {
      return {
        poolId: node.pool_id
      }
    }
    case SuiExchange.SPRINGSUI: {
      return {
        poolId: node.pool_id,
        // @ts-ignore
        weighthook_id: node.extra.SPRINGSUI.weighthook_id,
      }
    }
    case SuiExchange.STSUI: {
      return {
        poolId: node.pool_id
      }
    }
    case SuiExchange.OBRIC: {
      return {
        poolId: node.pool_id
      }
    }
  }
};