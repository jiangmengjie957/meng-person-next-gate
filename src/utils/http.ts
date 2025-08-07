import _ from "lodash";

type TFetchOptions = Omit<RequestInit, "headers" | "body"> & {
  headers?: Record<string, any>;
  params?: Record<string, any>;
  body?: Record<string, any> | BodyInit | null;
  timeout?: number;
};

// 默认配置
const defaultOptions: Partial<TFetchOptions> = {
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  },
  timeout: 60 * 1000,
};

// 拦截器
const requestInterceptors = (options: TFetchOptions) => {
  if (!options.headers) options.headers = {};
  options.headers["token"] = "111";
  return options;
};

// get请求body转化成query
const parseParams = (params?: Record<string, any>) => {
  const searchObj = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    searchObj.append(key, value);
  });
  const query = searchObj.toString();
  return query ? `?${query}` : "";
};

// fetch封装
const baseFetch = (
  url: string,
  fetchOptions?: TFetchOptions,
) => {
  // 处理request配置
  let options = _.merge(
    defaultOptions,
    fetchOptions
  ) as TFetchOptions;
  options = requestInterceptors(options);
  
  // 处理request参数
  let urlFix = url;
  if (_.toUpper(options.method) === "GET") {
    fetchOptions?.params && (urlFix = url + parseParams(fetchOptions.params));
  } else {
    fetchOptions?.body && (options.body = JSON.stringify(fetchOptions.body));
  }
  return globalThis.fetch(urlFix, options as RequestInit)
};

// 导出post请求
export const postStream = (url: string, body?: Record<string, any>) => {
  return baseFetch(url, { method: "post", body }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    console.log(response,'response123000')
    return response/* .json(); */
  });
};

export const post = (url: string, body?: Record<string, any>) => {
  return baseFetch(url, { method: "post", body }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    return response.json();
  }).catch((error) => {
    console.error('Post request error:', error);
    throw error;
  });
};