import axios from 'axios';
import { c as useRuntimeConfig } from './server.mjs';
import { u as useState } from './state-BVUnE2Hd.mjs';

let instance = null;
function useApi() {
  const demoUserEmail = useState("demoUserEmail", () => "alice@acme.com");
  if (!instance) {
    const config = useRuntimeConfig();
    instance = axios.create({
      baseURL: config.public.apiBase,
      withCredentials: true
    });
    instance.interceptors.request.use((request) => {
      const email = demoUserEmail.value;
      if (email) {
        request.headers = {
          ...request.headers,
          "x-demo-user": email
        };
      }
      return request;
    });
  }
  return instance;
}

export { useApi as u };
//# sourceMappingURL=api-msYOaHew.mjs.map
