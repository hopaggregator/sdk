## Hop SDK

Use this library to interact with [Hop Aggregator](hop.ag)'s swap.

`npm install @hop.ag/sdk`

#### Initialize

```typescript
import { HopApi, HopApiOptions } from "@hop.ag/sdk";
import { getFullnodeUrl } from "@mysten/sui/client";

const rpc_url = getFullNodeUrl("mainnet");
const hop_api_options: HopApiOptions = {
  api_key: "",
  fee_bps: 0,
  fee_wallet: "0x2",
};

const sdk = new HopApi(rpc_url, hop_api_options);
```

To use the Hop Aggregator API, please create an api key [here](https://hop.ag) first.

#### Get a Swap Quote

Call this first to display the expected amount out.

```typescript
const quote = await sdk.fetchQuote({
  token_in: "",
  token_out: "",
  amount_in: 0,
});
```

#### Get a Swap Transaction

Call this when a user clicks trade and wants to execute a transaction.

```typescript
const tx = await sdk.fetchTx({
  trade: quote.trade,
  sui_address: "0x123",

  gas_budget: 2e8, // optional default is 2e8
  max_slippage_bps: 100, // optional default is 1%

  return_output_coin_argument: false, // toggle to use the output coin in a ptb
});
```

#### Get a list of Verified Tokens
We maintain a list of verified SUI ecosystem tokens and their metadata. This
endpoint returns a curated list - with ordering - for your application.

```typescript
const tokens = await sdk.fetchTokens();
```

#### Attribution

Please link to and/or mention `Powered by Hop` if you are using this SDK.
