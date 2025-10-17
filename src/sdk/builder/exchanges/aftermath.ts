import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

// Taken from https://aftermath.finance/api/addresses
const POOLS_CONFIG = {
  packages: {
    amm: "0xc4049b2d1cc0f6e017fda8260e4377cecd236bd7f56a54fee120816e72e2e0dd",
  },
  objects: {
    poolRegistry:
      "0xfcc774493db2c45c79f688f88d28023a3e7d98e4ee9f48bbf5c7990f651577ae",
    protocolFeeVault:
      "0xf194d9b1bcad972e45a7dd67dd49b3ee1e3357a00a50850c52cd51bb450e13b4",
    treasury:
      "0x28e499dff5e864a2eafe476269a4f5035f1c16f338da7be18b103499abf271ce",
    insuranceFund:
      "0xf0c40d67b078000e18032334c3325c47b9ec9f3d9ae4128be820d54663d14e3b",
    lpCoinsTable:
      "0x7f3bb65251feccacc7f48461239be1008233b85594114f7bf304e5e5b340bf59",
  },
};

const REFERRAL_VAULT_OBJECT_ID =
  "0x35d35b0e5b177593d8c3a801462485572fc30861e6ce96a55af6dc4730709278";

export const buildAftermathSegment: SegmentBuildFn<SuiExchange.AFTERMATH> = (
  tx,
  segment,
  { coinIn },
) => {
  console.log(segment);
  // example call: https://suiexplorer.com/txblock/FxuYEfdTA74u4CHh435Htz1xRqqCBJTcRHpRPBfZshpm?network=mainnet
  const outputCoin = tx.moveCall({
    package: POOLS_CONFIG.packages.amm,
    module: "swap",
    function: "swap_exact_in",
    typeArguments: [
      segment.data.lpCoinType,
      segment.tokenFrom,
      segment.tokenTo,
    ],
    arguments: [
      tx.object(segment.data.poolId),
      tx.object(POOLS_CONFIG.objects.poolRegistry),
      tx.object(POOLS_CONFIG.objects.protocolFeeVault),
      tx.object(POOLS_CONFIG.objects.treasury),
      tx.object(POOLS_CONFIG.objects.insuranceFund),
      tx.object(REFERRAL_VAULT_OBJECT_ID),
      coinIn,
      // expected coins out
      // This number needs to be close to the expected output, between .01-100x
      // we should return the expected amount out from the API for each path segment
      tx.pure.u64(segment.data.expectedAmountOut),
      // max slippage % (with 18 decimal places)
      tx.pure.u64(BigInt(Math.floor(0.9 * 1e18))),
    ],
  });

  return {
    outputCoin,
    isDangling: true,
  };
};
