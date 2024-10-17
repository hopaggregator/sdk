
import { z } from "zod";
import { poolExtraSchema } from "../sdk/types/trade";

// @ts-ignore
async function quoteTest() {
  const result = poolExtraSchema.parse({
    hi:
      {
        b: 1,
        t: true,
        c: "yolo!",
        x: {
          "d": "hello"
        }
      }
  });

  console.log(result);
}

quoteTest();
