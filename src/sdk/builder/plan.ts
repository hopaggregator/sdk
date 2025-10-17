import type {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";

import { buildAftermathSegment } from "./exchanges/aftermath.js";
import { buildBluemoveSegment } from "./exchanges/bluemove.js";
import { buildCetusSegment } from "./exchanges/cetus.js";
import { buildDeepbookSegment } from "./exchanges/deepbook.js";
import { buildFlowxSegment } from "./exchanges/flowx.js";
import { buildKriyaSegment } from "./exchanges/kriya.js";
import { buildSuiswapSegment } from "./exchanges/suiswap.js";
import { buildTurbosSegment } from "./exchanges/turbos.js";
import { buildHopFunSegment } from "./exchanges/hopfun.js";
import { buildBluefinSegment } from "./exchanges/bluefin.js";
import { buildMovepumpSegment } from "./exchanges/movepump.js";
import { buildTurbosfunSegment } from "./exchanges/turbosfun.js";
import { buildSpringsuiSegment } from "./exchanges/springsui.js";
import { buildStsuiSegment } from "./exchanges/stsui.js";
import { buildObricSegment } from "./exchanges/obric.js";
import { buildMomentumSegment } from "./exchanges/momentum.js";
import { SuiExchange } from "../types/trade.js";

export type SwapPlanSegment = {
  tokenFrom: string;
  tokenTo: string;
} & (
  | {
      suiExchange: SuiExchange.CETUS;
      data: {
        /**
         * Object ID of the Cetus pool.
         */
        poolId: string;
        coinTypeA: string;
        coinTypeB: string;
        swapPartner?: string;
      };
    }
  | {
      suiExchange: SuiExchange.KRIYA;
      data: {
        /**
         * Object ID of the Kriya pool.
         */
        poolId: string;
        coinTypeX: string;
        coinTypeY: string;
        is_v3: boolean;
      };
    }
  | {
      suiExchange: SuiExchange.AFTERMATH;
      data: {
        poolId: string;
        lpCoinType: string;
        expectedAmountOut: bigint;
      };
    }
  | {
      suiExchange: SuiExchange.FLOWX;
      data: {
        is_v3: boolean;
        coinTypeA: string;
        coinTypeB: string;
        feeRate: number | undefined;
      };
    }
  | {
      suiExchange: SuiExchange.BLUEMOVE;
      data: null;
    }
  | {
      suiExchange: SuiExchange.TURBOS;
      data: {
        poolId: string;
        coinTypeA: string;
        coinTypeB: string;
        feeType: string;
        tick_current_index: number;
        tick_spacing: number;
      };
    }
  | {
      suiExchange: SuiExchange.DEEPBOOK;
      data: {
        poolId: string;
        baseAsset: string;
        quoteAsset: string;
        lotSize: bigint;
        minSize: bigint;
      };
    }
  | {
      suiExchange: SuiExchange.SUISWAP;
      data: {
        poolId: string;
        coinTypeX: string;
        coinTypeY: string;
      };
    }
  | {
      suiExchange: SuiExchange.HOPFUN;
      data: {
        poolId: string;
      };
    }
  | {
      suiExchange: SuiExchange.BLUEFIN;
      data: {
        poolId: string;
        coinTypeA: string;
        coinTypeB: string;
      };
    }
  | {
    suiExchange: SuiExchange.MOVEPUMP;
    data: {
      poolId: string;
    };
  }
  | {
    suiExchange: SuiExchange.TURBOSFUN;
    data: {
      poolId: string;
    }
  }
  | {
    suiExchange: SuiExchange.SPRINGSUI;
    data: {
      poolId: string;
      weighthook_id: string;
    }
  }
  | {
    suiExchange: SuiExchange.STSUI;
    data: {
      poolId: string;
    }
  }
  | {
    suiExchange: SuiExchange.OBRIC;
    data: {
      poolId: string;
    }
  }
  | {
    suiExchange: SuiExchange.MOMENTUM,
    data: {
      poolId: string;
      coinTypeA: string;
      coinTypeB: string;
    }
  }
);

export type SwapPlanSegmentOf<E extends SuiExchange> = SwapPlanSegment & {
  suiExchange: E;
};

export interface SegmentBuildResult {
  outputCoin: TransactionObjectArgument | null;
  /**
   * If true, then this Coin must be transferred back to the user at the end of the transaction.
   */
  isDangling: boolean;
}

export interface SegmentContext {
  coinIn: TransactionObjectArgument;
  senderAddress: string;
  minimumAmountOutForSegment?: bigint;
}

export type SegmentBuildFn<T extends SuiExchange> = (
  tx: Transaction,
  segment: SwapPlanSegmentOf<T>,
  context: SegmentContext,
) => SegmentBuildResult;

const segmentBuilders: {
  [K in SuiExchange]: SegmentBuildFn<K>;
} = {
  [SuiExchange.CETUS]: buildCetusSegment,
  [SuiExchange.KRIYA]: buildKriyaSegment,
  [SuiExchange.AFTERMATH]: buildAftermathSegment,
  [SuiExchange.FLOWX]: buildFlowxSegment,
  [SuiExchange.BLUEMOVE]: buildBluemoveSegment,
  [SuiExchange.TURBOS]: buildTurbosSegment,
  [SuiExchange.DEEPBOOK]: buildDeepbookSegment,
  [SuiExchange.SUISWAP]: buildSuiswapSegment,
  [SuiExchange.HOPFUN]: buildHopFunSegment,
  [SuiExchange.BLUEFIN]: buildBluefinSegment,
  [SuiExchange.MOVEPUMP]: buildMovepumpSegment,
  [SuiExchange.TURBOSFUN]: buildTurbosfunSegment,
  [SuiExchange.SPRINGSUI]: buildSpringsuiSegment,
  [SuiExchange.STSUI]: buildStsuiSegment,
  [SuiExchange.OBRIC]: buildObricSegment,
  [SuiExchange.MOMENTUM]: buildMomentumSegment,
};

export const getBuilder = <K extends SuiExchange>(
  exchange: K,
): SegmentBuildFn<K> => {
  return segmentBuilders[exchange];
};
