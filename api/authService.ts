// import apiClient from './apiClient';
// import { STORAGE_KEYS } from '../config/config';

// const API_ORIGIN = 'https://api.aithon-tech.com';

// async function ensureCsrfCookie() {
//   try {
//     // ✅ Fixed syntax - use parentheses, not template literal
//     await apiClient.get(`${API_ORIGIN}/sanctum/csrf-cookie`);
//   } catch (error) {
//     console.error('Failed to fetch CSRF cookie:', error);
//     throw error;
//   }
// }

// export const authService = {
//   async login(payload: { email: string; password: string }) {
//     await ensureCsrfCookie();

//     // ✅ Use JSON instead of FormData for Sanctum
//     const res = await apiClient.post('/auth/login', {
//       email: payload.email,
//       password: payload.password,
//     });

//     const { user, token, token_type } = res.data.data;
//     const storedUser = { ...user, token, token_type };
//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(storedUser));
//     return storedUser;
//   },

//   async register(payload: {
//     name: string;
//     email: string;
//     password: string;
//     password_confirmation: string;
//   }) {
//     await ensureCsrfCookie();

//     const res = await apiClient.post('/auth/register', payload);
//     const { user, token, token_type } = res.data.data;
//     const storedUser = { ...user, token, token_type };
//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(storedUser));
//     return storedUser;
//   },

//   logout() {
//     localStorage.removeItem(STORAGE_KEYS.USER);
//     localStorage.removeItem(STORAGE_KEYS.TOKEN);
//   },
// // };


//this for real auth
// import apiClient from './apiClient';
// import { STORAGE_KEYS } from '../config/config';
// import { User } from '../types';

// interface LoginPayload {
//   email: string;
//   password: string;
// }

// interface RegisterPayload {
//   name: string;
//   email: string;
//   password: string;
//   password_confirmation: string;
// }

// export const authService = {
//   async login(payload: LoginPayload): Promise<User> {
//     const res = await apiClient.post('/auth/login', payload);

//     const { user, token } = res.data.data;

//     // save auth data
//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
//     localStorage.setItem(STORAGE_KEYS.TOKEN, token);

//     return user;
//   },

//   async register(payload: RegisterPayload): Promise<User> {
//     const res = await apiClient.post('/auth/register', payload);

//     const { user, token } = res.data.data;

//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
//     localStorage.setItem(STORAGE_KEYS.TOKEN, token);

//     return user;
//   },

//   logout() {
//     localStorage.removeItem(STORAGE_KEYS.USER);
//     localStorage.removeItem(STORAGE_KEYS.TOKEN);
//   },
// };

// import apiClient from './apiClient';
// import { STORAGE_KEYS } from '../config/config';
// import { User } from '../types';

// interface LoginPayload {
//   email: string;
//   password: string;
// }

// interface RegisterPayload {
//   name: string;
//   email: string;
//   password: string;
//   password_confirmation: string;
// }

// type AuthResponse = {
//   user: User;
//   token: string;
//   token_type?: string;
// };

// function normalizeToken(raw: string) {
//   let token = (raw || '').trim();
//   if (token.toLowerCase().startsWith('bearer ')) token = token.slice(7).trim();
//   token = token.replace(/^"+|"+$/g, '');
//   return token;
// }

// export const authService = {
//   async login(payload: LoginPayload): Promise<AuthResponse> {
//     const res = await apiClient.post('/auth/login', payload);

//     const { employee, token, token_type } = res.data?.data || {};
//     const cleanToken = normalizeToken(token);

//     // store in ONE place (same keys used by apiClient + app)
//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(employee));
//     localStorage.setItem(STORAGE_KEYS.TOKEN, cleanToken);

//     // if your UI expects User shape, map here if needed
//     return { user: employee, token: cleanToken, token_type };
//   },

//   async register(payload: RegisterPayload): Promise<AuthResponse> {
//     const res = await apiClient.post('/auth/register', payload);

//     const { employee, token, token_type } = res.data?.data || {};
//     const cleanToken = normalizeToken(token);

//     localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(employee));
//     localStorage.setItem(STORAGE_KEYS.TOKEN, cleanToken);

//     return { user: employee, token: cleanToken, token_type };
//   },

//   logout() {
//     localStorage.removeItem(STORAGE_KEYS.USER);
//     localStorage.removeItem(STORAGE_KEYS.TOKEN);
//   },
// };


import apiClient from './apiClient';
import { STORAGE_KEYS } from '../config/config';

interface LoginPayload {
  email: string;
  password: string;
}

type AuthResponse = {
  employee: any;
  token: string;
};

function normalizeToken(raw: string) {
  let token = (raw || '').trim();
  token = token.replace(/^Bearer\s+/i, '');
  return token;
}

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post('/auth/login', payload);

    const { employee, token } = res.data.data;

    const cleanToken = normalizeToken(token);
    localStorage.setItem(STORAGE_KEYS.TOKEN, cleanToken);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(employee));

    return { employee, token: cleanToken };
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  },
};
