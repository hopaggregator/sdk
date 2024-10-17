import { SuiClient } from "@mysten/sui/client";
import {
  fetchQuote,
  GetQuoteParams,
  GetQuoteResponse,
} from "./routes/quote.js";
import { fetchTx, GetTxParams, GetTxResponse } from "./routes/tx.js";
import { fetchTokens, GetTokensResponse } from "./routes/tokens.js";
import { fetchPrice, GetPriceParams, GetPriceResponse } from "./routes/price.js";

export interface HopApiOptions {
  api_key: string;
  fee_bps: number; // fee to charge in bps (50% split with Hop / max fee of 5%)
  charge_fees_in_sui?: boolean,

  fee_wallet?: string; // sui address
  hop_server_url?: string;
}

export class HopApi {
  readonly client: SuiClient;
  readonly options: HopApiOptions;
  readonly use_v2: boolean;

  constructor(rpc_endpoint: string, options: HopApiOptions, use_v2: boolean = true) {
    this.client = new SuiClient({ url: rpc_endpoint });
    this.options = options;
    this.use_v2 = use_v2;

    this.validate_api_key();
    this.validate_fee();
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

  private validate_fee() {
    let fee_bps = this.options.fee_bps;

    if (fee_bps < 0) {
      console.error("> fee_bps must be positive.");
    } else if (fee_bps > 500) {
      console.error("> fee_bps must be less than or equal to 5% (500 bps).");
    }

    this.options.fee_bps = Math.max(this.options.fee_bps, 0);
    this.options.fee_bps = Math.min(this.options.fee_bps, 500);
    this.options.fee_bps = Number(this.options.fee_bps.toFixed(0));
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

  async fetchTokens(): Promise<GetTokensResponse> {
    return fetchTokens(this);
  }
  
  async fetchPrice(price: GetPriceParams): Promise<GetPriceResponse> {
    return fetchPrice(this, price);
  }
  
}
