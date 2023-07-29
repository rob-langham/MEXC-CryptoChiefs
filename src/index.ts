import axios from "axios";
import hmacSHA512 from "crypto-js/hmac-sha512";
import { PrivateClient } from "./client";
import { type } from "os";
import { Symbol as Instrument } from "./symbols";

class ExchangeAPI {
  public listOrders() {}
  public listPositions() {}
}

class ContractClient {
  public static BASE_URL = "https://contract.mexc.com";
  private client: PrivateClient = new PrivateClient(ContractClient.BASE_URL);

  public async assets() {
    return this.client.get("/api/v1/private/account/assets");
  }

  public async openPosition() {
    return this.client.get("/api/v1/private/position/open_positions");
  }

  public async historicalOrders() {
    return this.client.get("/api/v1/private/order/list/history_orders");
  }

  public async openOrders(symbol: Instrument) {
    return this.client.get("/api/v1/private/order/list/open_orders/" + symbol);
  }

  public async contractDetails(symbol: Instrument) {
    return this.client.get("/api/v1/contract/detail?symbol=" + symbol);
  }

  public async allContractDetails() {
    return this.client.get("/api/v1/contract/detail");
  }
}

type DCAOrderOptions = {
  entryPriceStart: number;
  entryPriceEnd: number;
  risk: number;
  stopLoss: number;
  dcaOrderCount: number;
  takeProfit?: number[];
};

type Side = "BUY" | "SELL";

class LimitOrderManager {
  private client = new ContractClient();

  public async placeLimitOrder(symbol: Instrument, options: DCAOrderOptions) {}

  public async placeDCALimitOrder(symbol: Instrument, options: DCAOrderOptions) {
    const limitPrices = [options.entryPriceStart];

    const side: Side = options.entryPriceStart > options.entryPriceEnd ? "BUY" : "SELL";

    for (let i = 1; i < options.dcaOrderCount; i++) {
      limitPrices.push(
        options.entryPriceStart +
          ((options.entryPriceEnd - options.entryPriceStart) / (options.dcaOrderCount - 1)) * i
      );
    }

    const averagePrice = limitPrices.reduce((a, b) => a + b, 0) / limitPrices.length;

    console.log("limitPrices:", limitPrices);
    console.log("averagePrice:", averagePrice);

    const quantity = Math.abs(averagePrice - options.stopLoss) / options.risk;

    const symbolDetails = await this.client.contractDetails(symbol);

    console.log("symbolDetails:", symbolDetails);

    console.log(
      "size:",
      quantity / symbolDetails.data.contractSize,
      "quantity:",
      quantity,
      Math.abs(averagePrice - options.stopLoss)
    );

    console.log(await this.client.openOrders(symbol));
  }
}

async function main() {
  // console.log(await client.openOrders("XLM_USDT"));
  // console.log(JSON.stringify((await client.allContractDetails()).data.map((x: any) => x.symbol)));
  new LimitOrderManager().placeDCALimitOrder("MKR_USDT", {
    entryPriceStart: 100,
    entryPriceEnd: 200,
    risk: 1,
    stopLoss: 150 - 10,
    dcaOrderCount: 5,
  });
  // new LimitOrderManager().placeDCALimitOrder("BTC_USDT", {
  //   entryPriceStart: 100,
  //   entryPriceEnd: 200,
  //   risk: 300,
  //   stopLoss: 90,
  //   dcaOrderCount: 5,
  // });
}

main().catch(console.error);
