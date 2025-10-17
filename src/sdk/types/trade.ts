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
  HOPFUN = "HOPFUN",
  BLUEFIN = "BLUEFIN",
  MOVEPUMP = "MOVEPUMP",
  TURBOSFUN = "TURBOSFUN",
  SPRINGSUI = "SPRINGSUI",
  STSUI = "STSUI",
  OBRIC = "OBRIC",
  MOMENTUM = "MOMENTUM"
}

export const suiExchangeSchema = z.nativeEnum(SuiExchange);

export const poolExtraSchema = z.union([
  z.object({
    AFTERMATH: z.object({
      lp_coin_type: z.string(),
    }).passthrough(),
  }),
  z.object({
    DEEPBOOK: z.object({
      pool_type: z.string(),
      lot_size: z.coerce.bigint(),
      min_size: z.coerce.bigint()
    }).passthrough(),
  }),
  z.object({
    TURBOS: z.object({
      coin_type_a: z.string(),
      coin_type_b: z.string(),
      fee_type: z.string(),
      tick_spacing: z.number(),
      tick_current_index: z.number(),
    }).passthrough(),
  }),
  z.object({
    CETUS: z.object({
      coin_type_a: z.string(),
      coin_type_b: z.string(),
    }).passthrough(),
  }),
  z.object({
    FLOWX: z.object({
      is_v3: z.boolean(),
      fee_rate: z.number().nullish(),
    }).passthrough()
  }),
  z.object({
    KRIYA: z.object({
      is_v3: z.boolean()
    }).passthrough()
  }),
  z.object({
    SPRINGSUI: z.object({
      weighthook_id: z.string(),
      weighthook_version: z.number()
    })
  }),
  z.object({}).passthrough(),
  z.null()
]);

export type PoolExtra = z.infer<typeof poolExtraSchema>;