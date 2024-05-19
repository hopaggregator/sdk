import { z } from "zod";
import { tradeSchema } from "./trade.js";

const coinIdSchema = z.object({
  object_id: z.string(),
  version: z.string(),
  digest: z.string(),
});

export const builderRequestSchema = z.object({
  sender_address: z.string(),
  user_input_coins: z.array(
    z.object({
      object_id: coinIdSchema,
      coin_type: z.string(),
      amount: z.string(),
    }),
  ),
  gas_coins: z.array(coinIdSchema),
  gas_budget: z.number(),
  max_slippage_bps: z.optional(z.number()),
  api_fee_bps: z.optional(z.number()),
  api_fee_wallet: z.optional(z.string()),
});

export type BuilderRequest = z.infer<typeof builderRequestSchema>;

export const compileRequestSchema = z.object({
  trade: tradeSchema,
  builder_request: builderRequestSchema,
});

export type CompileRequest = z.infer<typeof compileRequestSchema>;

export const swapAPIResponseSchema = z.object({
  total_tests: z.number(),
  errors: z.number(),
  trade: tradeSchema.nullable(),
});

export type SwapAPIResponse = z.infer<typeof swapAPIResponseSchema>;

export const compileResponseSchema = z.object({
  tx: z.string(),
});

export type CompileResponse = z.infer<typeof compileResponseSchema>;

export const tokensResponseSchema = z.object({
  tokens: z.array(z.object({
    coin_type: z.string(),
    name: z.string(),
    ticker: z.string(),
    icon_url: z.string(),
    decimals: z.number(),
    token_order: z.nullable(z.number())
  }))
})
