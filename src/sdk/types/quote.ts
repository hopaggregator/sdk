import { z } from "zod";
import { poolExtraSchema, suiExchangeSchema } from "./trade.js";

export const hopSchema = z.object({
  pool_id: z.string(),
  extra: poolExtraSchema,
  exchange: suiExchangeSchema,
  from: z.string(),
  to: z.string(),
  tokens: z.array(z.string()),
  is_v3: z.boolean(),
  fee_bps: z.bigint().or(z.number()),
  expected_amount_out: z.bigint().or(z.number()),
});

export type Hop = z.infer<typeof hopSchema>;

export const plannedRouteSchema = z.object({
  amount_in: z.bigint().or(z.number()),
  amount_out: z.bigint().or(z.number()),
  hops: z.array(hopSchema)
});

export type PlannedRoute = z.infer<typeof plannedRouteSchema>;

export const gammaQuoteSchema = z.object({
  routes: z.array(plannedRouteSchema),
  coin_in: z.string(),
  coin_out: z.string(),
  amount_in: z.bigint().or(z.number()),
  amount_out: z.bigint().or(z.number())
});

export type GammaQuote = z.infer<typeof gammaQuoteSchema>;