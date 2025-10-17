import fetch from "cross-fetch";
import { z } from "zod";
import { API_SERVER_PREFIX, FEE_DENOMINATOR } from "./constants.js";
import { normalizeStructTag } from "@mysten/sui/utils";

export interface RequestParams {
  hop_server_url?: string;
  data: object;
  method: "get" | "post";
}

export async function makeAPIRequest<O>({
  route,
  options,
  responseSchema,
}: {
  route: string;
  options: RequestParams;
  responseSchema: z.ZodSchema<O>;
}): Promise<O> {
  try {
    const response = await fetch(
      `${options.hop_server_url ?? API_SERVER_PREFIX}/${route}`,
      {
        method: options.method,
        body: JSON.stringify(
          {
            ...options.data,
          },
          (_, v) => {
            const isBigIntString = typeof v === 'string' && /^\d+n$/.test(v);
            if (isBigIntString) v.slice(-1);
            return typeof v === 'bigint' || isBigIntString ? parseInt(v.toString()) : v;
          },
        ),
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.status !== 200) {
      throw new Error(
        `HopApi > Error on request '/${route}' : ${response.statusText}`,
      );
    }

    const result = responseSchema.safeParse(await response.json());
    if (result.success) {
      return result.data;
    } else {
      console.error(result.error);
      throw new Error(`Invalid response: ${result.error.message}`);
    }
  } catch (error) {
    console.error(error);
    throw new Error(
      `HopApi > Error on request '/${route}' : ${(error as Error).message}`,
    );
  }
}

export function getAmountOutWithCommission(
  amount_out: bigint,
  fee_bps: number,
): bigint {
  if (fee_bps == 0) {
    return amount_out;
  }

  return (
    (amount_out * (FEE_DENOMINATOR - BigInt(fee_bps))) / BigInt(FEE_DENOMINATOR)
  );
}

const NORMALIZED_SUI_COIN_TYPE = normalizeStructTag("0x2::sui::SUI");

export function isSuiType(coin_type: string) {
  return NORMALIZED_SUI_COIN_TYPE == normalizeStructTag(coin_type);
}