## Hop SDK

Use this library to interact with [Hop Aggregator](hop.ag)'s swap. To request an api key, please
email [**api@hop.ag**](mailto:api@hop.ag). We do offer enterprise plans for specific traders and businesses.


`npm install @hop.ag/sdk`

#### Initialize

```typescript
import { HopApi, HopApiOptions } from "@hop.ag/sdk";
import { getFullnodeUrl } from "@mysten/sui/client";

const rpc_url = getFullNodeUrl("mainnet");
const hop_api_options: HopApiOptions = {
  api_key: "",
  
  // 1bps = 0.01%. 10_000bps = 100%. 
  // max fee is 470bps (4.7%).
  fee_bps: 0,
  fee_wallet: "Enter your sui address here"
};

const sdk = new HopApi(rpc_url, hop_api_options);
```

#### 1. Get a Swap Quote

Call this first to display the expected amount out.

```typescript
const quote = await sdk.fetchQuote({
  token_in: "",
  token_out: "",
  amount_in: 0,
});
```

#### 2. Get a Swap Transaction

Call this when a user clicks trade and wants to execute a transaction.

```typescript
const tx = await sdk.fetchTx({
  trade: quote.trade,
  sui_address: "VALID_SUI_ADDRESS_HERE",

  gas_budget: 0.03e9, // optional default is 0.03 SUI
  max_slippage_bps: 100, // optional default is 1%

  return_output_coin_argument: false, // toggle to use the output coin in a ptb
});
```

#### 3. Get the price of a Token
Return the real-time on-chain price of a token. This pricing API uses Defi pools.
It will return two items: the price of the token in SUI as base units, and the price
of SUI in USD.

```typescript
const price = await sdk.fetchPrice({
  coin_type: "0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP"
});

const deep_price_in_sui = price.price_sui;
const deep_price_in_usd = price.price_usd;
const price_of_sui_in_usd = price.sui_price;
```

#### 4. Get a list of Verified Tokens
We maintain a list of verified SUI ecosystem tokens and their metadata. This
endpoint returns a curated list - with ordering - for your application.

```typescript
const tokens = await sdk.fetchTokens();
```

#### Automatic Updates
As soon as new liquidity sources become available, your
SDK will automatically aggregate them, without anything required on your end.

#### Attribution

Please link to and/or mention `Powered by Hop` if you are using this SDK.