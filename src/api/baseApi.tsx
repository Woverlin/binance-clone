import querystring from "query-string";
import cryptoJS from "crypto-js";
import variables from "./variable";
import axios from "axios";
import STORE_KEYS from "../utils/constant";

const getApiUrl = (url: any, parameters: any, secretKey?: string) => {
  const secretKeyParam = secretKey ?? sessionStorage.getItem(STORE_KEYS.secretKey);

  console.log("secretKeyParam", secretKeyParam);

  const { method, host } = variables ?? {};
  const encoded_parameters = querystring
    .stringify(parameters)
    .replace(/\+/g, "%20")
    .replace(/\:/g, "%3A");
  const sorted_parameters = encoded_parameters.split("&").sort().join("&");
  const string_to_sign = `${method}\n${host.toLowerCase()}\n${url}\n${sorted_parameters}`;
  const signature = cryptoJS
    .HmacSHA256(string_to_sign, secretKeyParam as string)
    .toString(cryptoJS.enc.Base64);
  const encoded_signature = encodeURIComponent(signature);
  const signed_request = `https://${host}${url}?${sorted_parameters}&Signature=${encoded_signature}`;
  return signed_request;
};

const baseApi = async ({
  url,
  params,
  method = "get",
}: {
  url: string;
  params?: any;
  method?: string;
}) => {
  const { DEFAULT_PARAMS } = variables ?? {};
  const secretKey = params?.secretKey;

  const AccessKeyId: any = sessionStorage.getItem(STORE_KEYS.accessKeyId);

  let newParams:any = { ...DEFAULT_PARAMS };

  
  if (method === "get") {
    newParams = { ...params, ...newParams };
  }
  if (AccessKeyId) newParams.AccessKeyId = AccessKeyId;
  delete newParams?.secretKey;
  
  console.log("method", method);
  console.log("newParams", newParams);
  console.log("params", params);

  const parseUrl = getApiUrl(url, newParams, secretKey);

  
  const config = {
    url: parseUrl,
    method,
    ...(method === "post" && {
      params,
    }),
  };

  console.log("config", config);

  return await axios(config);
};
export default baseApi;
