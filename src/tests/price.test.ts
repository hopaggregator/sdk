import { HopApi } from "../index";
import { getFullnodeUrl } from "@mysten/sui/client";

// @ts-ignore
async function priceTest() {
  const api = new HopApi(getFullnodeUrl("mainnet"), {
    api_key: "",
    fee_bps: 0,
    hop_server_url: "http://localhost:3002/api/v2"
  });

  const result = await api.fetchPrice({
    coin_type: "0x1c6cd615ed4c42a34977212a3407a28eec21acc572c8dbe7d0382bf0289a2590::plop::PLOP"
  });

  console.log("result", result);
}

priceTest();
