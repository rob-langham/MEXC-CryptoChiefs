import { PrivateClient } from "./private.client";
import { Symbol as Instrument } from "./symbols.model";

export class ContractClient {
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
