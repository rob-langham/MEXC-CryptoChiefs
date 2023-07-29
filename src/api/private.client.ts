import axios, { Method } from "axios";
import { HmacSHA256, HmacSHA512 } from "crypto-js";
import { URLSearchParams } from "url";

// export class Base {
//   public config: any = {};
//   constructor(apiKey: string, apiSecret: string) {
//     this.config.apiKey = apiKey;
//     this.config.apiSecret = apiSecret;
//     this.config.baseURL = "https://api.mexc.com/api/v3";
//   }

//   public publicRequest(method: string, path: string, paramsObj: any = {}): any {
//     paramsObj = removeEmptyValue(paramsObj);
//     paramsObj = buildQueryString(paramsObj);
//     if (paramsObj !== "") {
//       path = `${path}?${paramsObj}`;
//     }

//     return createRequest({
//       method: method,
//       baseURL: this.config.baseURL,
//       url: path,
//       headers: {
//         "Content-Type": "application/json",
//         "X-MEXC-APIKEY": this.config.apiKey,
//       },
//     });
//   }

//   public signRequest(method: string, path: string, paramsObj: any = {}): any {
//     const timestamp = Date.now();
//     paramsObj = removeEmptyValue(paramsObj);
//     const queryString = buildQueryString({ ...paramsObj, timestamp });
//     const signature = crypto
//       .createHmac("sha256", this.config.apiSecret)
//       .update(queryString)
//       .digest("hex");

//     return createRequest({
//       method: method,
//       baseURL: this.config.baseURL,
//       url: `${path}?${queryString}&signature=${signature}`,
//       headers: {
//         "Content-Type": "application/json",
//         "X-MEXC-APIKEY": this.config.apiKey,
//       },
//     });
//   }
// }

function buildQueryString(params?: Record<any, string | number | boolean>) {
  return Object.entries(params || {})
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");
}

export class PrivateClient {
  constructor(private baseUrl: string) {}
  async get(path: string, params?: Record<any, string | number | boolean>) {
    const timestamp = Date.now();
    const queryString = buildQueryString(params);
    const signedMessage = process.env.API_ACCESS_KEY! + timestamp + queryString;
    const signature = HmacSHA256(signedMessage, process.env.API_SECRET_KEY!).toString();

    return (
      await axios.get(this.baseUrl + path, {
        headers: {
          "Request-Time": timestamp,
          ApiKey: process.env.API_ACCESS_KEY!,
          "Content-Type": "application/json",
          Signature: signature,
        },
      })
    ).data;
  }

  async post(path: string, params?: Record<any, string | number | boolean>, body?: any) {
    const timestamp = Date.now();
    const queryString = buildQueryString(params);
    const bodyStr = JSON.stringify(body);
    const signedMessage = process.env.API_ACCESS_KEY! + timestamp + queryString + bodyStr;
    const signature = HmacSHA256(signedMessage, process.env.API_SECRET_KEY!).toString();

    console.log("signature:", signature);
    console.log("timestamp:", timestamp);
    console.log("queryString:", queryString);
    console.log("signedMessage:", signedMessage);

    return (
      await axios.get(this.baseUrl + path, {
        headers: {
          "Request-Time": timestamp,
          ApiKey: process.env.API_ACCESS_KEY!,
          "Content-Type": "application/json",
          Signature: signature,
        },
        data: body,
      })
    ).data;
  }
}
