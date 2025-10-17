import { SuiClient } from "@mysten/sui/client";
import {
  fetchQuote,
  GetQuoteParams,
} from "./routes/quote.js";
import { Transaction } from "@mysten/sui/transactions";
import { TradeBuilder } from "./builder/index.js";
import { BuildTxParams } from "./routes/tx.js";
import { GammaQuote } from "./types/quote.js";

export interface HopApiOptions {
  fee_bps: bigint; // fee to charge in bps (50% split with Hop / max fee of 5%)
  charge_fees_in_sui?: boolean,

  fee_wallet?: string; // sui address
  hop_server_url?: string; // custom hop server url
}

export class HopApi {
  readonly client: SuiClient;
  readonly options: HopApiOptions;
  readonly use_v2: boolean;

  constructor(rpc_endpoint: string, options: HopApiOptions, use_v2: boolean = true) {
    this.client = new SuiClient({ url: rpc_endpoint });
    this.options = options;
    this.use_v2 = use_v2;

    this.validate_fee();
  }

  private validate_fee() {
    const fee_bps = Number(this.options.fee_bps);

    if (fee_bps < 0) {
      console.error("> fee_bps must be positive.");
    } else if (fee_bps > 500) {
      console.error("> fee_bps must be less than or equal to 5% (500 bps).");
    }

    this.options.fee_bps = BigInt(Math.min(500, Math.max(fee_bps, 0)));
  }

  /*
   * Routes
   */

  async fetchQuote(quote: GetQuoteParams): Promise<GammaQuote | null> {
    return fetchQuote(this, quote);
  }

  buildTx(params: BuildTxParams): Transaction {
    const builder = new TradeBuilder(params.quote, BigInt(this.options.fee_bps));

    return builder.compileToTX({
      senderAddress: params.sender_address,
      userInputCoins: params.user_input_coins,
      maxSlippageBps: params.max_slippage_bps
    });
  }

}
