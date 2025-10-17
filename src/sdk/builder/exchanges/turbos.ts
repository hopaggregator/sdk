import { SUI_CLOCK_OBJECT_ID, normalizeStructTag } from "@mysten/sui/utils";
import type { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

// Object IDs here: https://s3.amazonaws.com/app.turbos.finance/sdk/contract.json

const VERSIONED_OBJECT_ID =
  "0xf1cf0e81048df168ebeb1b8030fad24b3e0b53ae827c25053fff0779c1445b6f";

const TURBOS_PACKAGE_ID =
  "0x9df4666296ee324a6f11e9f664e35e7fd6b6e8c9e9058ce6ee9ad5c5343c2f87";

const MIN_TICK_INDEX = -443636;

const MAX_TICK_INDEX = 443636;

export const calcSqrtPriceLimit = (a2b: boolean) => {
  return tickIndexToSqrtPriceX64(a2b ? MIN_TICK_INDEX : MAX_TICK_INDEX);
};

function tickIndexToSqrtPriceX64(tickIndex: number): bigint {
  if (tickIndex > 0) {
    return BigInt(tickIndexToSqrtPricePositive(tickIndex));
  } else {
    return BigInt(tickIndexToSqrtPriceNegative(tickIndex));
  }
}

function tickIndexToSqrtPricePositive(tick: number) {
  let ratio: bigint;

  if ((tick & 1) != 0) {
    ratio = BigInt("79232123823359799118286999567");
  } else {
    ratio = BigInt("79228162514264337593543950336");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79236085330515764027303304731"),
      96,
      256,
    );
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79244008939048815603706035061"),
      96,
      256,
    );
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79259858533276714757314932305"),
      96,
      256,
    );
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79291567232598584799939703904"),
      96,
      256,
    );
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79355022692464371645785046466"),
      96,
      256,
    );
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79482085999252804386437311141"),
      96,
      256,
    );
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("79736823300114093921829183326"),
      96,
      256,
    );
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("80248749790819932309965073892"),
      96,
      256,
    );
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("81282483887344747381513967011"),
      96,
      256,
    );
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("83390072131320151908154831281"),
      96,
      256,
    );
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("87770609709833776024991924138"),
      96,
      256,
    );
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("97234110755111693312479820773"),
      96,
      256,
    );
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("119332217159966728226237229890"),
      96,
      256,
    );
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("179736315981702064433883588727"),
      96,
      256,
    );
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("407748233172238350107850275304"),
      96,
      256,
    );
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("2098478828474011932436660412517"),
      96,
      256,
    );
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("55581415166113811149459800483533"),
      96,
      256,
    );
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(
      ratio * BigInt("38992368544603139932233054999993551"),
      96,
      256,
    );
  }

  return signedShiftRight(ratio, 32, 256);
}

function tickIndexToSqrtPriceNegative(tickIndex: number) {
  const tick = Math.abs(tickIndex);
  let ratio: bigint;

  if ((tick & 1) != 0) {
    ratio = BigInt("18445821805675392311");
  } else {
    ratio = BigInt("18446744073709551616");
  }

  if ((tick & 2) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18444899583751176498"), 64, 256);
  }
  if ((tick & 4) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18443055278223354162"), 64, 256);
  }
  if ((tick & 8) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18439367220385604838"), 64, 256);
  }
  if ((tick & 16) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18431993317065449817"), 64, 256);
  }
  if ((tick & 32) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18417254355718160513"), 64, 256);
  }
  if ((tick & 64) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18387811781193591352"), 64, 256);
  }
  if ((tick & 128) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18329067761203520168"), 64, 256);
  }
  if ((tick & 256) != 0) {
    ratio = signedShiftRight(ratio * BigInt("18212142134806087854"), 64, 256);
  }
  if ((tick & 512) != 0) {
    ratio = signedShiftRight(ratio * BigInt("17980523815641551639"), 64, 256);
  }
  if ((tick & 1024) != 0) {
    ratio = signedShiftRight(ratio * BigInt("17526086738831147013"), 64, 256);
  }
  if ((tick & 2048) != 0) {
    ratio = signedShiftRight(ratio * BigInt("16651378430235024244"), 64, 256);
  }
  if ((tick & 4096) != 0) {
    ratio = signedShiftRight(ratio * BigInt("15030750278693429944"), 64, 256);
  }
  if ((tick & 8192) != 0) {
    ratio = signedShiftRight(ratio * BigInt("12247334978882834399"), 64, 256);
  }
  if ((tick & 16384) != 0) {
    ratio = signedShiftRight(ratio * BigInt("8131365268884726200"), 64, 256);
  }
  if ((tick & 32768) != 0) {
    ratio = signedShiftRight(ratio * BigInt("3584323654723342297"), 64, 256);
  }
  if ((tick & 65536) != 0) {
    ratio = signedShiftRight(ratio * BigInt("696457651847595233"), 64, 256);
  }
  if ((tick & 131072) != 0) {
    ratio = signedShiftRight(ratio * BigInt("26294789957452057"), 64, 256);
  }
  if ((tick & 262144) != 0) {
    ratio = signedShiftRight(ratio * BigInt("37481735321082"), 64, 256);
  }

  return ratio;
}

function signedShiftRight(n0: bigint, shiftBy: number, _bitWidth: number) {
  return n0 >> BigInt(shiftBy);
}

export const buildTurbosSegment: SegmentBuildFn<SuiExchange.TURBOS> = (
  tx,
  segment,
  { coinIn, senderAddress },
) => {
  const a2b =
    normalizeStructTag(segment.tokenFrom) ===
    normalizeStructTag(segment.data.coinTypeA);
  const functionName = a2b ? "swap_a_b_with_return_" : "swap_b_a_with_return_";
  const inputCoinBalance = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn],
  });

  // https://github.com/turbos-finance/turbos-sui-move-interface/blob/main/clmm/sources/swap_router.move#L26
  const [outputCoin, inputCoin] = tx.moveCall({
    target: `${TURBOS_PACKAGE_ID}::swap_router::${functionName}`,
    typeArguments: [
      segment.data.coinTypeA,
      segment.data.coinTypeB,
      segment.data.feeType,
    ],
    arguments: [
      tx.object(segment.data.poolId),
      tx.makeMoveVec({ elements: [coinIn] }),
      // amount
      inputCoinBalance,
      // amount_threshold
      // without including this, for some reason the transaction still goes through
      // tx.pure(0),
      // minimumAmountOutForSegment
      //   ? tx.pure(minimumAmountOutForSegment.raw)
      tx.pure.u64(0),
      // sqrt_price_limit
      tx.pure.u128(calcSqrtPriceLimit(a2b)),
      // is_exact_in
      tx.pure.bool(true),
      // recipient
      tx.pure.address(senderAddress),
      // deadline (unix timestamp in ms)
      tx.pure.u64(3000000000000),
      tx.object(SUI_CLOCK_OBJECT_ID),
      tx.object(VERSIONED_OBJECT_ID),
    ],
  });
  if (!outputCoin || !inputCoin) {
    throw new Error("missing output or input");
  }
  tx.transferObjects([inputCoin], senderAddress);

  return {
    outputCoin,
    isDangling: true,
  };
};
