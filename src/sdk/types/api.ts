import { z } from "zod";
import { gammaTradeSchema } from "./trade.js";

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
  
  sponsored: z.optional(z.boolean()),
  gas_coins: z.array(coinIdSchema),
  
  gas_budget: z.number(),
  
  max_slippage_bps: z.optional(z.number()),
  
  api_fee_bps: z.optional(z.number()),
  api_fee_wallet: z.optional(z.string()),
  charge_fees_in_sui: z.optional(z.boolean()),

  base_transaction: z.optional(z.string()),
  input_coin_argument: z.optional(z.number()),
  input_coin_argument_nested: z.optional(z.array(z.number()).length(2)),
  input_coin_argument_input: z.optional(z.number()),
  
  return_output_coin_argument: z.optional(z.boolean())
}).passthrough();

export type BuilderRequest = z.infer<typeof builderRequestSchema>;

export const compileRequestSchema = z.object({
  trade: gammaTradeSchema.passthrough(),
  builder_request: builderRequestSchema.passthrough(),
});

export type CompileRequest = z.infer<typeof compileRequestSchema>;

export const swapAPIResponseSchema = z.object({
  total_tests: z.number(),
  errors: z.number(),
  trade: gammaTradeSchema.passthrough().nullable(),
}).passthrough();

export type SwapAPIResponse = z.infer<typeof swapAPIResponseSchema>;

export const compileResponseSchema = z.object({
  tx: z.string(),
  output_coin: z.string().nullish(),
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
  }).passthrough())
}).passthrough();

export const priceResponseSchema = z.object({
  coin_type: z.string(),
  price_sui: z.number(),
  sui_price: z.number()
}).passthrough();
