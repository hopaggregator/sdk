import { SuiClient } from "@mysten/sui.js/client";
import { fetchQuote, GetQuoteParams, GetQuoteResponse } from "./routes/quote";
import { fetchTx, GetTxParams, GetTxResponse } from "./routes/tx";

class HopApi {
  readonly client: SuiClient;
  readonly api_key: string;

  constructor(rpc_endpoint: string, api_key: string) {
    this.client = new SuiClient({ url: rpc_endpoint });
    this.api_key = api_key;

    this.validate_api_key();
  }

  private validate_api_key() {
    if (!this.api_key.startsWith("hopapi")) {
      console.error(
        "Error > Invalid api key:",
        this.api_key,
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
