import { CoinStruct } from "@mysten/sui/client";
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions";
import { TransactionArgument } from "@mysten/sui/transactions";
import { normalizeStructTag } from "@mysten/sui/utils";

/**
 * Select the CoinAsset objects from a list of CoinAsset objects that have a balance greater than or equal to a given amount.
 *
 * @param coins The list of CoinAsset objects to select from.
 * @param amount The amount to select CoinAsset objects with a balance greater than or equal to.
 * @param exclude A list of CoinAsset objects to exclude from the selection.
 * @returns The CoinAsset objects that have a balance greater than or equal to the given amount.
 */
export function selectCoinObjectIdGreaterThanOrEqual(
  coins: CoinStruct[],
  amount: bigint,
  exclude: string[] = [],
): {
  objectArray: string[];
  remainCoins: CoinStruct[];
  amountArray: bigint[];
} {
  const selectedResult = selectCoinAssetGreaterThanOrEqual(
    coins,
    amount,
    exclude,
  );
  const objectArray = selectedResult.selectedCoins.map(
    (item) => item.coinObjectId,
  );
  const remainCoins = selectedResult.remainingCoins;
  const amountArray = selectedResult.selectedCoins.map((item) =>
    BigInt(item.balance),
  );
  return { objectArray, remainCoins, amountArray };
}

/**
 * Select the CoinAsset objects from a list of CoinAsset objects that have a balance greater than or equal to a given amount.
 *
 * @param coins The list of CoinAsset objects to select from.
 * @param amount The amount to select CoinAsset objects with a balance greater than or equal to.
 * @param exclude A list of CoinAsset objects to exclude from the selection.
 * @returns The CoinAsset objects that have a balance greater than or equal to the given amount.
 */
function selectCoinAssetGreaterThanOrEqual(
  coins: CoinStruct[],
  amount: bigint,
  exclude: string[] = [],
): { selectedCoins: CoinStruct[]; remainingCoins: CoinStruct[] } {
  const sortedCoins = sortByBalance(
    coins.filter((c) => !exclude.includes(c.coinObjectId)),
  );

  const total = calculateTotalBalance(sortedCoins);

  if (total < amount) {
    return { selectedCoins: [], remainingCoins: sortedCoins };
  }
  if (total === amount) {
    return { selectedCoins: sortedCoins, remainingCoins: [] };
  }

  let sum = BigInt(0);
  const selectedCoins: CoinStruct[] = [];
  const remainingCoins = [...sortedCoins];
  while (sum < total) {
    const target = amount - sum;
    const coinWithSmallestSufficientBalanceIndex = remainingCoins.findIndex(
      (c) => BigInt(c.balance) >= target,
    );
    if (coinWithSmallestSufficientBalanceIndex !== -1) {
      const nextCoin = remainingCoins[coinWithSmallestSufficientBalanceIndex];
      if (!nextCoin) {
        throw new Error("invalid nextCoin index");
      }
      selectedCoins.push(nextCoin);
      remainingCoins.splice(coinWithSmallestSufficientBalanceIndex, 1);
      break;
    }

    const coinWithLargestBalance = remainingCoins.pop()!;
    if (BigInt(coinWithLargestBalance.balance) > 0) {
      selectedCoins.push(coinWithLargestBalance);
      sum += BigInt(coinWithLargestBalance.balance);
    }
  }
  return {
    selectedCoins: sortByBalance(selectedCoins),
    remainingCoins: sortByBalance(remainingCoins),
  };
}
/**
 * Sort the CoinAsset objects by their balance.
 *
 * @param coins The CoinAsset objects to sort.
 * @returns The sorted CoinAsset objects.
 */
function sortByBalance(coins: CoinStruct[]): CoinStruct[] {
  return coins.sort((a, b) =>
    a.balance < b.balance ? -1 : a.balance > b.balance ? 1 : 0,
  );
}

/**
 * Calculate the total balance of a list of CoinAsset objects.
 *
 * @param coins The list of CoinAsset objects to calculate the total balance for.
 * @returns The total balance of the CoinAsset objects.
 */
function calculateTotalBalance(coins: CoinStruct[]): bigint {
  return coins.reduce(
    (partialSum, c) => partialSum + BigInt(c.balance),
    BigInt(0),
  );
}

export function isSuiCoin(coinAddress: string): boolean {
  return normalizeStructTag(coinAddress) === normalizeStructTag("0x2::sui::SUI");
}

export function isUSDCCoin(coinAddress: string): boolean {
  return normalizeStructTag(coinAddress) === normalizeStructTag("0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC");
}

/**
 * Get the CoinAsset objects for a given coin type.
 *
 * @param coinType The coin type to get the CoinAsset objects for.
 * @param allSuiObjects The list of all SuiMoveObjects.
 * @returns The CoinAsset objects for the given coin type.
 */
function getCoinAssets(
  coinType: string,
  allSuiObjects: CoinStruct[],
): CoinStruct[] {
  return allSuiObjects.filter((c) => normalizeStructTag(coinType) === normalizeStructTag(c.coinType));
}

export type BuildCoinResult = {
  targetCoin: TransactionObjectArgument;
  remainCoins: CoinStruct[];
  isMintZeroCoin: boolean;
  targetCoinAmount: bigint;
  originalSplitedCoin?: TransactionObjectArgument;
};

const callMintZeroValueCoin = (txb: Transaction, coinType: string) => {
  return txb.moveCall({
    target: "0x2::coin::zero",
    typeArguments: [coinType],
  });
};

function buildZeroValueCoin(
  allCoins: CoinStruct[],
  tx: Transaction,
  coinType: string,
): BuildCoinResult {
  const targetCoin = callMintZeroValueCoin(tx, coinType);
  return {
    targetCoin,
    remainCoins: allCoins,
    isMintZeroCoin: true,
    targetCoinAmount: BigInt(0),
  };
}

export function buildCoinForAmount(
  tx: Transaction,
  allCoins: CoinStruct[],
  amount: bigint,
  coinType: string
): BuildCoinResult {
  const coinAssets: CoinStruct[] = getCoinAssets(coinType, allCoins);
  if (amount === BigInt(0) && coinAssets.length === 0) {
    return buildZeroValueCoin(allCoins, tx, coinType);
  }
  const amountTotal = calculateTotalBalance(coinAssets);
  if (amountTotal < amount) {
    throw new Error(
      `The amount(${amountTotal}) is insufficient balance for ${coinType}  expect ${amount.toString()}`,
    );
  }

  return buildCoin(tx, coinAssets, amount, coinType);
}

export function buildCoin(
  tx: Transaction,
  coinAssets: CoinStruct[],
  amount: bigint,
  coinType: string,
): BuildCoinResult {
  if (isSuiCoin(coinType)) {
    if (amount === 0n && coinAssets.length > 1) {
      const selectedCoinsResult = selectCoinObjectIdGreaterThanOrEqual(
        coinAssets,
        amount,
      );
      const firstCoin = selectedCoinsResult.objectArray[0];
      const firstAmount = selectedCoinsResult.amountArray[0];
      if (!firstCoin || firstAmount === undefined) {
        throw new Error("missing first coin");
      }
      return {
        targetCoin: tx.object(firstCoin),
        remainCoins: selectedCoinsResult.remainCoins,
        targetCoinAmount: firstAmount,
        isMintZeroCoin: false,
      };
    }
    const selectedCoinsResult = selectCoinObjectIdGreaterThanOrEqual(
      coinAssets,
      amount,
    );
    const amountCoin = tx.splitCoins(tx.gas, [tx.pure.u64(amount)]);
    return {
      targetCoin: amountCoin,
      remainCoins: selectedCoinsResult.remainCoins,
      targetCoinAmount: amount,
      isMintZeroCoin: false,
      originalSplitedCoin: tx.gas,
    };
  }

  const selectedCoinsResult = selectCoinObjectIdGreaterThanOrEqual(
    coinAssets,
    amount,
  );
  const totalSelectedCoinAmount = selectedCoinsResult.amountArray.reduce(
    (a, b) => a + b,
    BigInt(0),
  );
  const coinObjectIds = selectedCoinsResult.objectArray;
  const [primaryCoinA, ...mergeCoinAs] = coinObjectIds;
  if (!primaryCoinA) {
    throw new Error("missing primaryCoinA");
  }
  const primaryCoinAObject: TransactionArgument = tx.object(primaryCoinA);

  let targetCoin: TransactionArgument = primaryCoinAObject;
  let targetCoinAmount = selectedCoinsResult.amountArray.reduce(
    (a, b) => a + b,
    BigInt(0),
  );
  let originalSplitedCoin;
  if (mergeCoinAs.length > 0) {
    tx.mergeCoins(
      primaryCoinAObject,
      mergeCoinAs.map((coin) => tx.object(coin)),
    );
  }

  if (Number(totalSelectedCoinAmount) > Number(amount)) {
    targetCoin = tx.splitCoins(primaryCoinAObject, [tx.pure.u64(amount)]);
    targetCoinAmount = amount;
    originalSplitedCoin = primaryCoinAObject;
  }

  return {
    targetCoin,
    remainCoins: selectedCoinsResult.remainCoins,
    originalSplitedCoin,
    targetCoinAmount,
    isMintZeroCoin: false,
  };
}
