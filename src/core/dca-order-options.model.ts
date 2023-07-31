import Decimal from "decimal.js";

export type DCAOrderOptions = {
  entryPriceStart: Decimal;
  entryPriceEnd: Decimal;
  risk: Decimal;
  stopLoss: Decimal;
  dcaOrderCount: number;
  takeProfit?: number[];
};
