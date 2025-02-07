class MFetch {
  constructor() {
    //
  }

  // 封装的Fetch请求函数
  nextFetch = (
    url: string,
    method = "GET",
    data = null,
    customOptions: RequestInit,
    timeout = 5000
  ) => {
    const options: RequestInit = {
      method,
      body: data ? JSON.stringify(data) : null,
      headers: {
        "Content-Type": "application/json",
        ...customOptions.headers,
      },
      ...customOptions,
    };

    // if (data) {
    //   options.body = JSON.stringify(data);
    // }

    // const customFetch = () =>
    console.log(url, options, "options");
    return fetch(url, options)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        throw error;
      });

    // return Promise.race([
    //   customFetch(),
    //   new Promise((_, reject) =>
    //     setTimeout(() => reject(new Error("Request timed out")), timeout)
    //   ),
    // ]);
  };

  // 封装的GET请求函数
  get = (
    url: string,
    params?: Record<string, any>,
    customOptions: RequestInit = {}
  ) => {
    if (Array.isArray(params)) {
      for (const val of params) {
        url += `/${val}`;
      }
      params = {};
    }
    return this.nextFetch(url, "GET", null, customOptions);
  };
  getStream: any = async (
    url: string,
    params?: Record<string, any>,
  ) => {
   
    const streamOptions = {
      method: "GET",
      dataType: "text/event-stream",
      headers: {
        'Content-Type': 'application/json'
      }
    }
    const response = await fetch(url, streamOptions)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.body?.getReader();
  };
}

const mFetch = new MFetch();

export default mFetch;
