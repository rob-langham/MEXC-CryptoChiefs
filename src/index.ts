import "./axios-bigint";
import Decimal from "decimal.js";
import { LimitOrderManager } from "./core/limit-order-manager";
import os from "os";
import path from "path";
import { existsSync, mkdirSync, readFileSync, readSync, writeFileSync } from "fs";
import axios from "axios";
import { Message, Result, TelegramUpdateResponse } from "./api/telegram/update.model";
import { symbols } from "./api/mexc/symbols.model";
import {
  Observable,
  ObservableInput,
  concatWith,
  exhaustMap,
  filter,
  from,
  ignoreElements,
  interval,
  map,
  merge,
  mergeMap,
  of,
  scan,
  share,
  tap,
} from "rxjs";
import { off } from "process";

const FORMAT = /.+ENTRY LIMIT.+Entry Zone:.+(TP\d: .+)+.*SL:.*/s;

class MessageParser {
  parse(message: string) {
    if (!message.match(FORMAT)) {
      return null;
    }

    const lines = message.split("\n");

    const symbol = lines
      .find((line) => line.includes(" / USDT"))!
      .trim()
      .split(" ")[0];

    const entryZone = lines
      .find((line) => line.includes(" - "))!
      .split(" - ")
      .map((x) => x.replace(",", "").trim())
      .map((x) => new Decimal(x));

    const tp = lines
      .filter((line) => line.match(/^TP\d: /))
      .map((line) => line.trim().split(":")[1].trim())
      .map((x) => new Decimal(x.replace(",", "")));

    const sl = new Decimal(
      lines
        .find((line) => line.startsWith("SL: "))!
        .split(":")[1]
        .trim()
        .replace(",", "")
    );

    return {
      symbol,
      entryZone,
      tp,
      sl,
    };
  }
}

class TelegramBotApi {
  public static cryptoChiefsPremiumGroupChatID = -1001520291354;
  private offset: number;

  private _messages$ = new Observable<Result>((subscriber) => {
    interval(1000)
      .pipe(
        exhaustMap(async () => {
          const updates = await this.getUpdates({ offset: this.offset + 1, timeout: 60 });
          this.offset =
            updates.result[updates.result.length - 1]?.update_id.toNumber() ?? this.offset;
          return updates.result;
        }),
        tap((updates) => console.log(updates)),
        mergeMap((m) => from(m)),
        filter(
          (m) => m.message.forward_from_chat?.id == TelegramBotApi.cryptoChiefsPremiumGroupChatID
        ),
        filter((m) => !!m.message.text.match(FORMAT))
      )
      .subscribe(subscriber);
  }).pipe(share());

  constructor() {
    this.offset = this.getUpdateId() || 0;
  }

  private storeUpdateId(updateId: Decimal) {
    if (!existsSync(path.join(os.homedir(), ".crypto-chiefs"))) {
      mkdirSync(path.join(os.homedir(), ".crypto-chiefs"));
    }

    const db = path.join(os.homedir(), ".crypto-chiefs", ".telegram.json");
    const data = existsSync(db) ? JSON.parse(readFileSync(db, "utf8")) : {};
    data.updateId = updateId.toNumber();
    writeFileSync(db, JSON.stringify(data, null, 2));
  }

  private getUpdateId(): number | undefined {
    const db = path.join(os.homedir(), ".crypto-chiefs", ".telegram.json");
    if (existsSync(db)) {
      console.log("Reading file", db);
      return JSON.parse(readFileSync(db, "utf8")).updateId;
    }
  }

  private loadMessages() {}

  /**
   * @param handler After handler completes, the message will be ignored in future
   * @returns
   */
  public messages$(handler: (message: Message) => ObservableInput<unknown>): Observable<never> {
    return this._messages$.pipe(
      mergeMap((m) => from(handler(m.message)).pipe(ignoreElements(), concatWith(of(m)))),
      tap((m) => this.storeUpdateId(m.update_id)),
      ignoreElements()
    );
  }

  private async getUpdates(
    options: {
      offset?: number;
      limit?: number;
      timeout?: number;
    } = {}
  ): Promise<TelegramUpdateResponse> {
    console.log("getUpdates", options);
    return (
      await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`, {
        params: options,
      })
    ).data as TelegramUpdateResponse;
  }
}

async function main() {
  const bot = new TelegramBotApi();

  bot
    .messages$((m) => {
      console.log(m.forward_from_message_id, new MessageParser().parse(m.text));
      return of(null);
    })

    .subscribe();
  // const trade = new MessageParser().parse(MSG);
  // console.log(trade);
  // console.log(
  //   await new LimitOrderManager().placeDCALimitOrder("MKR_USDT", {
  //     entryPriceStart: trade.entryZone[0],
  //     entryPriceEnd: trade.entryZone[1],
  //     risk: new Decimal(300),
  //     stopLoss: trade.sl,
  //     dcaOrderCount: 5,
  //   })
  // );
  // console.log(
  //   symbols.includes((trade.symbol + "_USDT") as any),
  //   symbols.includes((trade.symbol + "_USD") as any)
  // );
}

main().catch(console.error);
