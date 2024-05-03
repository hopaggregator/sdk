import axios from "axios";

interface RequestParams {
  api_key: string,
  data: object,
  method: 'get' | 'post'
}

async function makeRequest(
  route: string,
  options: RequestParams
): Promise<object | null> {
  const response = await axios({
    method: options.method,
    url: `${API_SERVER_PREFIX}/${route}`,
    headers: {
      "x-hop-api-key": options.api_key
    },
    data: options.data
  });

  if(response.status != 200) {
    console.error(`HopApi > Error on request '/${route}' : ${response.statusText}`);
    return null;
  }

  return response.data;
}

export {
  RequestParams,
  makeRequest
}