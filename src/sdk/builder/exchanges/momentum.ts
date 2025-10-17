import { normalizeStructTag, normalizeSuiObjectId } from "@mysten/sui/utils";

import type { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const MOMENTUM_PACKAGE_ID =
  "0xcf60a40f45d46fc1e828871a647c1e25a0915dec860d2662eb10fdb382c3c1d1";

const MOMENTUM_VERSION_OBJECT_ID =
  "0x2375a0b1ec12010aaea3b2545acfa2ad34cfbba03ce4b59f4c39e1e25eed1b2a";

export const HOP_FUN_PACKAGE_ID =
  "0xda79a03bd1cfcd082d713ee615dd7fe5f4574019ddad131466312fa5d1369077";

export const buildMomentumSegment: SegmentBuildFn<SuiExchange.MOMENTUM> = (
  tx,
  segment,
  { coinIn, senderAddress },
) => {
  const a2b = normalizeStructTag(segment.data.coinTypeA) === normalizeStructTag(segment.tokenFrom);

  const LowLimitPrice = BigInt('4295048017');
  const HighLimitPrice = BigInt('79226673515401279992447579050');
  const poolObject = tx.object(segment.data.poolId);

  const limitSqrtPrice = a2b ? LowLimitPrice : HighLimitPrice;

  const amount = tx.moveCall({
    target: '0x2::coin::value',
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn]
  });

  const [receive_a, receive_b, flash_receipt] = tx.moveCall({
    target: `${MOMENTUM_PACKAGE_ID}::trade::flash_swap`,
    typeArguments: [segment.data.coinTypeA, segment.data.coinTypeB],
    arguments: [
      poolObject,
      tx.pure.bool(a2b),
      tx.pure.bool(true),
      amount,
      tx.pure.u128(limitSqrtPrice),
      tx.object(normalizeSuiObjectId('0x6')),
      tx.object(MOMENTUM_VERSION_OBJECT_ID),
    ],
  });

  tx.moveCall({
    target: `0x2::balance::destroy_zero`,
    arguments: [a2b ? receive_a! : receive_b!],
    typeArguments: [segment.tokenFrom],
  });

  const [zeroCoin] = tx.moveCall({
    target: `0x2::coin::zero`,
    arguments: [],
    typeArguments: [segment.tokenTo],
  });

  const [coinADebt, coinBDebt] = tx.moveCall({
    target: `${MOMENTUM_PACKAGE_ID}::trade::swap_receipt_debts`,
    typeArguments: [],
    arguments: [flash_receipt!],
  });

  const pay_coin_a = a2b
    ? tx.moveCall({
      target: `0x2::coin::split`,
      arguments: [coinIn, coinADebt!],
      typeArguments: [segment.tokenFrom],
    })
    : zeroCoin;

  const pay_coin_b = a2b
    ? zeroCoin
    : tx.moveCall({
      target: `0x2::coin::split`,
      arguments: [coinIn, coinBDebt!],
      typeArguments: [segment.tokenFrom],
    });

  const pay_coin_a_balance = tx.moveCall({
    target: `0x2::coin::into_balance`,
    typeArguments: [segment.data.coinTypeA],
    arguments: [pay_coin_a!],
  });

  const pay_coin_b_balance = tx.moveCall({
    target: `0x2::coin::into_balance`,
    typeArguments: [segment.data.coinTypeB],
    arguments: [pay_coin_b!],
  });

  tx.moveCall({
    target: `${MOMENTUM_PACKAGE_ID}::trade::repay_flash_swap`,
    typeArguments: [segment.data.coinTypeA, segment.data.coinTypeB],
    arguments: [
      poolObject,
      flash_receipt!,
      pay_coin_a_balance,
      pay_coin_b_balance,
      tx.object(MOMENTUM_VERSION_OBJECT_ID),
    ],
  });

  const outputCoin = tx.moveCall({
    target: `0x2::coin::from_balance`,
    typeArguments: [segment.tokenTo],
    arguments: [a2b ? receive_b! : receive_a!],
  });

  // destroy if zero
  tx.moveCall({
    target: `${HOP_FUN_PACKAGE_ID}::meme::delete_or_return`,
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn!, tx.pure.address(senderAddress)],
  });

  return {
    outputCoin: outputCoin,
    isDangling: true,
  };
};
