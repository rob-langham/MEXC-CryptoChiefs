import axios from "axios";
import Decimal from "decimal.js";

axios.defaults.transformResponse = [
  (data) => {
    if (typeof data === "string") {
      try {
        return JSON.parse(data, (_, value) => {
          if (typeof value === "number") {
            return new Decimal(value.toString());
          }
          return value;
        });
      } catch (e) {}
    }
    return data;
  },
];

// TODO axios.defaults.transformRequest
