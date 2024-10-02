import { HopApi } from "../index";
import { getFullnodeUrl } from "@mysten/sui/client";

// @ts-ignore
async function priceTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "hopapisKX7I30wPvo5YfN8Vx5P9r4cPh3nzVcS",
    fee_bps: 0,
    // hop_server_url: "http://localhost:3002/api/v2"
  });

  const result = await api.fetchPrice({
    coin_type: "0x06b145d0322e389d6225f336ab57bba4c67e4e701bd6c6bc959d90675900a17e::meow::MEOW"
  });

  console.log("result", result);
}

priceTest();
