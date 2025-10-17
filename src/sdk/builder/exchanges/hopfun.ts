import { SegmentBuildFn } from "../plan.js";
import { SuiExchange } from "../../types/trade.js";

export const buildHopFunSegment: SegmentBuildFn<SuiExchange.HOPFUN> = (
  _tx,
  _segment,
  _context,
) => {
 throw new Error("no hop fun yet");
};
