import { z } from "zod";

export enum SuiExchange {
  CETUS = "CETUS",
  FLOWX = "FLOWX",
  TURBOS = "TURBOS",
  AFTERMATH = "AFTERMATH",
  KRIYA = "KRIYA",
  BLUEMOVE = "BLUEMOVE",
  DEEPBOOK = "DEEPBOOK",
  SUISWAP = "SUISWAP",
}

const poolExtraSchema = z.union([
  z.object({
    AFTERMATH: z.object({
      lp_coin_type: z.string(),
    }),
  }),
  z.object({
    DEEPBOOK: z.object({
      pool_type: z.string(),
      lot_size: z.coerce.bigint(),
      min_size: z.coerce.bigint()
    }),
  }),
  z.object({
    TURBOS: z.object({
      coin_type_a: z.string(),
      coin_type_b: z.string(),
      fee_type: z.string(),
      tick_spacing: z.number(),
      tick_current_index: z.number(),
    }),
  }),
  z.object({
    CETUS: z.object({
      coin_type_a: z.string(),
      coin_type_b: z.string(),
    }),
  }),
  z.object({
    FLOWX: z.object({
      is_v3: z.boolean(),
      fee_rate: z.number().nullish(),
    })
  })
]);

export type PoolExtra = z.infer<typeof poolExtraSchema>;

const tradePoolSchema = z.object({
  object_id: z.string(),
  initial_shared_version: z.number().nullable(),
  sui_exchange: z.nativeEnum(SuiExchange),
  tokens: z.array(z.string()).nonempty(),
  is_active: z.boolean(),
  extra: poolExtraSchema.nullable(),
});

export type TradePool = z.infer<typeof tradePoolSchema>;

const tokenAmountSchema = z.object({
  token: z.string(),
  amount: z.coerce.bigint(),
});

const tradeNodeSchema = z.object({
  pool: tradePoolSchema,
  weight: z.number().nonnegative(),
  amount_in: tokenAmountSchema,
  amount_out: tokenAmountSchema,
});

export type TradeNode = z.infer<typeof tradeNodeSchema>;

export const tradeSchema = z.object({
  nodes: z.record(tradeNodeSchema),
  edges: z.record(z.array(z.string())),
  amount_in: tokenAmountSchema,
  amount_out: tokenAmountSchema,
});

export type Trade = z.infer<typeof tradeSchema>;
