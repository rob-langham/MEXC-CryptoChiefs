import { Instrument } from "../api/mexc/symbols.model";
import Decimal from "decimal.js";
import { ContractClient } from "../api/mexc/contract.client";
import { DCAOrderOptions } from "./dca-order-options.model";

export type Side = "BUY" | "SELL";

export class LimitOrderManager {
  private client = new ContractClient();

  public async placeLimitOrder(symbol: Instrument, options: DCAOrderOptions) {}

  public async placeDCALimitOrder(symbol: Instrument, options: DCAOrderOptions) {
    const limitPrices = [options.entryPriceStart];

    const side: Side = options.entryPriceStart > options.entryPriceEnd ? "BUY" : "SELL";

    for (let i = 1; i < options.dcaOrderCount; i++) {
      limitPrices.push(
        options.entryPriceStart.plus(
          options.entryPriceEnd
            .minus(options.entryPriceStart)
            .div(options.dcaOrderCount - 1)
            .mul(i)
        )
      );
    }

    const averagePrice = limitPrices
      .reduce((a, b) => a.plus(b), new Decimal(0))
      .div(limitPrices.length);

    const quantity = averagePrice.minus(options.stopLoss).abs().div(options.risk);

    const symbolDetails = await this.client.contractDetails(symbol);

    return {
      limitPrices,
      averagePrice,
      quantity,
      symbolDetails: {
        contractSize: symbolDetails.data.contractSize,
      },
      side,
    };
  }
}
