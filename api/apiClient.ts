// // import axios from 'axios';
// // import { API_CONFIG, STORAGE_KEYS } from '../config/config';

// // const apiClient = axios.create({
// //   baseURL: API_CONFIG.baseURL,
// //   timeout: API_CONFIG.timeout,
// //   headers: {
// //     'Content-Type': 'application/json',
// //     Accept: 'application/json',
// //   },
// //   withCredentials: false, // ❌ مهم: مفيش Cookies
// // });

// // // Add Bearer token automatically
// // // apiClient.interceptors.request.use((config) => {
// // //   const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
// // //   if (token) {
// // //     config.headers.Authorization = `Bearer ${token}`;
// // //   }
// // //   return config;
// // // });

// // // apiClient.interceptors.request.use((config) => {
// // //   let token = localStorage.getItem(STORAGE_KEYS.TOKEN) || '';
// // //   token = token.trim();

// // //   if (token.toLowerCase().startsWith('bearer ')) {
// // //     token = token.slice(7).trim();
// // //   }

// // //   token = token.replace(/^"+|"+$/g, ''); // يشيل quotes لو موجودة

// // //   if (token) {
// // //     config.headers = config.headers ?? {};
// // //     config.headers.Authorization = `Bearer ${token}`;
// // //   }
// // //   return config;
// // // });


// // apiClient.interceptors.request.use((config) => {
// //   let token = localStorage.getItem('userToken') || '';

// //   token = token.trim();

// //   // لو متخزن "Bearer xxx" خليه "xxx"
// //   if (token.toLowerCase().startsWith('bearer ')) {
// //     token = token.slice(7).trim();
// //   }

// //   // ✅ شيل " " من بداية ونهاية التوكن لو موجودة
// //   token = token.replace(/^"+|"+$/g, '');

// //   if (token) {
// //     config.headers = config.headers ?? {};
// //     config.headers['Authorization'] = `Bearer ${token}`;
// //   }

// //   return config;
// // });



// // // Global auth error handler
// // apiClient.interceptors.response.use(
// //   (response) => response,
// //   (error) => {
// //     // if (error.response?.status === 401) {
// //     //   localStorage.removeItem(STORAGE_KEYS.USER);
// //     //   localStorage.removeItem(STORAGE_KEYS.TOKEN);
// //     //   window.location.reload();
// //     // }
// //     return Promise.reject(error);
// //   }
// // );

// // export default apiClient;




// import axios from 'axios';
// import { API_CONFIG, STORAGE_KEYS } from '../config/config';

// const apiClient = axios.create({
//   baseURL: API_CONFIG.baseURL,
//   timeout: API_CONFIG.timeout,
//   headers: API_CONFIG.headers,
//   withCredentials: true, // ✅ Critical for cookies
// });

// // Auto-attach token to requests
// apiClient.interceptors.request.use(
//   (config) => {
//     const userStr = localStorage.getItem(STORAGE_KEYS.USER);
//     if (userStr) {
//       const user = JSON.parse(userStr);
//       if (user.token) {
//         config.headers.Authorization = `Bearer ${user.token}`;
//       }
//     }

//     // ✅ Read XSRF token from cookie and add to header
//     const xsrfToken = getCookie('XSRF-TOKEN');
//     if (xsrfToken) {
//       config.headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrfToken);
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Helper to read cookies
// function getCookie(name: string): string | null {
//   const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
//   return match ? match[2] : null;
// }

// export default apiClient;


// apiClient.ts  (TOKEN ONLY)
import axios from 'axios';
import { API_CONFIG, STORAGE_KEYS } from '../config/config';

const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL, // https://store-api.aithon-tech.com/api
  timeout: API_CONFIG.timeout,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false, // ✅ مهم: شيل cookies mode
});

apiClient.interceptors.request.use((config) => {
  let token = (localStorage.getItem(STORAGE_KEYS.TOKEN) || '').trim();

  // لو اتخزن بالغلط "Bearer ..."
  token = token.replace(/^Bearer\s+/i, '').replace(/^"+|"+$/g, '');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.headers = config.headers ?? {};
  config.headers.Accept = 'application/json';

  return config;
});

export default apiClient;
