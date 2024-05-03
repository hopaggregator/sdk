## Hop SDK

Use this library to interact with [Hop Aggregator](hop.ag)'s swap.

`npm install hop-ag-sdk`

#### Initialize

```typescript
import { HopApi } from "hop-ag-sdk";
import { getFullnodeUrl } from "@mysten/sui.js/client";

const rpc_url = getFullNodeUrl("mainnet");
const hop_api_key = "YOUR_API_KEY";

const sdk = HopApi(rpc_url, hop_api_key);
```

To use the Hop Aggregator API, please create an api key [here](https://hop.ag) first.

#### Get a Swap Quote

```typescript
const quote = await sdk.fetchQuote({
  token_in: "",
  token_out: "",
  amount_in: 0,
});
```

#### Get a Swap Transaction

```typescript
const tx = await sdk.fetchQuote({
  token_in: "",
  token_out: "",
  amount_in: 0,
  sui_address: "0x123",
});
```
