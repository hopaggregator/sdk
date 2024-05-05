import { SuiClient } from "@mysten/sui.js/client";
import { fetchQuote, GetQuoteParams, GetQuoteResponse } from "./routes/quote";
import { fetchTx, GetTxParams, GetTxResponse } from "./routes/tx";

interface ApiOptions {
  api_key: string;
  fee_bps: number; // fee to charge in bps (50% split with Hop / max fee of 5%)
}

class HopApi {
  readonly client: SuiClient;
  readonly options: ApiOptions;

  constructor(rpc_endpoint: string, options: ApiOptions) {
    this.client = new SuiClient({ url: rpc_endpoint });
    this.options = options;

    this.validate_api_key();
  }

  private validate_api_key() {
    if (!this.options.api_key.startsWith("hopapi")) {
      console.error(
        "Error > Invalid api key:",
        this.options.api_key,
        ". Please contact us at hop.ag to request a new key.",
      );
    }
  }

  /*
   * Routes
   */

  async fetchQuote(quote: GetQuoteParams): Promise<GetQuoteResponse> {
    return fetchQuote(this, quote);
  }

  async fetchTx(tx: GetTxParams): Promise<GetTxResponse> {
    return fetchTx(this, tx);
  }
}

export { HopApi };
