import type { TransactionResult } from "@mysten/sui/transactions";
import type { TransactionArgument } from "@mysten/sui/transactions";

import type { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

const CLOCK_ADDRESS =
  "0x0000000000000000000000000000000000000000000000000000000000000006";

const clmmMainnet = {
  fullRpcUrl: "https://sui-mainnet-endpoint.blockvision.org/",
  simulationAccount: {
    address:
      "0x326ce9894f08dcaa337fa232641cc34db957aec9ff6614c1186bc9a7508df0bb",
  },
  cetus_config: {
    package_id:
      "0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f",
    published_at:
      "0x95b8d278b876cae22206131fb9724f701c9444515813042f54f0a426c9a3bc2f",
    config: {
      coin_list_id:
        "0x8cbc11d9e10140db3d230f50b4d30e9b721201c0083615441707ffec1ef77b23",
      launchpad_pools_id:
        "0x1098fac992eab3a0ab7acf15bb654fc1cf29b5a6142c4ef1058e6c408dd15115",
      clmm_pools_id:
        "0x15b6a27dd9ae03eb455aba03b39e29aad74abd3757b8e18c0755651b2ae5b71e",
      admin_cap_id:
        "0x39d78781750e193ce35c45ff32c6c0c3f2941fa3ddaf8595c90c555589ddb113",
      global_config_id:
        "0x0408fa4e4a4c03cc0de8f23d0c2bbfe8913d178713c9a271ed4080973fe42d8f",
      coin_list_handle:
        "0x49136005e90e28c4695419ed4194cc240603f1ea8eb84e62275eaff088a71063",
      launchpad_pools_handle:
        "0x5e194a8efcf653830daf85a85b52e3ae8f65dc39481d54b2382acda25068375c",
      clmm_pools_handle:
        "0x37f60eb2d9d227949b95da8fea810db3c32d1e1fa8ed87434fc51664f87d83cb",
    },
  },
  clmm_pool: {
    package_id:
      "0x1eabed72c53feb3805120a081dc15963c204dc8d091542592abaf7a35689b2fb",
    published_at:
      "0x75b2e9ecad34944b8d0c874e568c90db0cf9437f0d7392abfd4cb902972f3e40",
    config: {
      pools_id:
        "0xf699e7f2276f5c9a75944b37a0c5b5d9ddfd2471bf6242483b03ab2887d198d0",
      global_config_id:
        "0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f",
      global_vault_id:
        "0xce7bceef26d3ad1f6d9b6f13a953f053e6ed3ca77907516481ce99ae8e588f2b",
      admin_cap_id:
        "0x89c1a321291d15ddae5a086c9abc533dff697fde3d89e0ca836c41af73e36a75",
    },
  },
  integrate: {
    package_id:
      "0x996c4d9480708fb8b92aa7acf819fb0497b5ec8e65ba06601cae2fb6db3312c3",
    published_at:
      "0xb2db7142fa83210a7d78d9c12ac49c043b3cbbd482224fea6e3da00aa5a5ae2d",
  },
  deepbook: {
    package_id:
      "0x000000000000000000000000000000000000000000000000000000000000dee9",
    published_at:
      "0x000000000000000000000000000000000000000000000000000000000000dee9",
  },
  deepbook_endpoint_v2: {
    package_id:
      "0xac95e8a5e873cfa2544916c16fe1461b6a45542d9e65504c1794ae390b3345a7",
    published_at:
      "0xac95e8a5e873cfa2544916c16fe1461b6a45542d9e65504c1794ae390b3345a7",
  },
  aggregatorUrl: "https://api-sui.cetus.zone/router",
} as const;

/**
 * The maximum sqrt-price supported by the clmmpool program.
 * @category Constants
 */
export const MAX_SQRT_PRICE = "79226673515401279992447579055";

/**
 * The minimum sqrt-price supported by the clmmpool program.
 * @category Constants
 */
export const MIN_SQRT_PRICE = "4295048016";

/**
 * Get the default sqrt price limit for a swap.
 *
 * @param a2b - true if the swap is A to B, false if the swap is B to A.
 * @returns The default sqrt price limit for the swap.
 */
function getDefaultSqrtPriceLimit(a2b: boolean): bigint {
  return BigInt(a2b ? MIN_SQRT_PRICE : MAX_SQRT_PRICE);
}

export const buildCetusSegment: SegmentBuildFn<SuiExchange.CETUS> = (
  tx,
  segment,
  { coinIn, senderAddress },
) => {
  // direction of the swap
  const a2b: boolean = segment.data.coinTypeA === segment.tokenFrom;

  const sqrtPriceLimit = getDefaultSqrtPriceLimit(a2b);
  const typeArguments = [segment.data.coinTypeA, segment.data.coinTypeB];

  const inputCoinBalance = tx.moveCall({
    target: "0x2::coin::value",
    typeArguments: [segment.tokenFrom],
    arguments: [coinIn],
  });
  const oppositeCoin = tx.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [segment.tokenTo],
  });

  console.log("typeArguments", typeArguments);
  console.log("poolId", segment.data.poolId);

  // see: https://github.com/CetusProtocol/cetus-clmm-interface?tab=readme-ov-file#pool-related-operations
  // also see: https://suivision.xyz/txblock/7JsAfQW6JmU7Jk9TFxGekoHTii4f18ZbgaonhZKhsg8h
  const args = [
    // global config
    tx.object(clmmMainnet.clmm_pool.config.global_config_id),
    // pool
    tx.object(segment.data.poolId),
    // coin_a
    a2b ? coinIn : oppositeCoin,
    // coin_b
    a2b ? oppositeCoin : coinIn,
    // a2b
    tx.pure.bool(a2b),
    // by_amount_in: when it equal true means want to fix the amount  of input coin. when it equal false means want to fix the amount of output coin.
    tx.pure.bool(true),
    // amount: when by_amount_in equals true, amount means the quantity of input coin, when by_amount_in equals false, amount means the quantity of output coin.
    inputCoinBalance,
    // amount_limit: the threshold value of coin. when by_amount_in equals true, it means the minimum amount about received coin, when by_amount_in equals false, it means the maximum amount abount sold.
    // minimumAmountOutForSegment
    //   ? tx.pure(minimumAmountOutForSegment.raw)
    //   : tx.pure(0),
    // sqrt_price_limit
    tx.pure.u128(sqrtPriceLimit),
    // no idea what this is, but it seems to always be false
    tx.pure.bool(false),
    tx.object(CLOCK_ADDRESS),
  ];

  const rawResult: TransactionResult = tx.moveCall({
    target: `${clmmMainnet.integrate.published_at}::router::swap`,
    typeArguments,
    arguments: args,
  });
  const coinA: TransactionArgument = {
    NestedResult: [rawResult.Result, 0],
  };
  const coinB: TransactionArgument = {
    NestedResult: [rawResult.Result, 1],
  };
  const inputCoin = a2b ? coinA : coinB;
  tx.transferObjects([inputCoin], senderAddress);
  const outputCoin = a2b ? coinB : coinA;
  return { outputCoin, isDangling: true };
};
