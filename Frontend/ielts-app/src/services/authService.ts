import axios from "axios";
import { jwtDecode } from "jwt-decode";
import type { UserCreateDTO } from "./userService";

const API_BASE = import.meta.env.VITE_API_BASE as string;

interface LoginRequestDTO {
  email: string;
  password: string;
}

interface AuthResponseDTO {
  token: string;
  email: string;
  role: string;
}

interface JWTPayload {
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier": string; // User ID
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name": string; // Username
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress": string; // Email
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role": string; // Role
  exp: number; // Expiration (standard claim)
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
}

const client = axios.create({
  baseURL: `${API_BASE}/api`,
});

export async function login(
  credentials: LoginRequestDTO
): Promise<AuthResponseDTO> {
  const response = await client.post("Auth/login", credentials);
  return response.data;
}

export async function registerNewUser(
  newUser: UserCreateDTO
): Promise<boolean> {
  const response = await client.post("Auth/register", newUser);
  return response.data;
}

export function storeToken(token: string): void {
  localStorage.setItem("authToken", token);
}

export function getToken(): string | null {
  return localStorage.getItem("authToken");
}

export function removeToken(): void {
  localStorage.removeItem("authToken");
}

const CLAIMS = {
  NAME_IDENTIFIER:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
  NAME: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  EMAIL: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  ROLE: "http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
} as const;

export function getCurrentUser(): UserInfo | null {
  const token = getToken();
  if (!token) return null;
  try {
    const decoded = jwtDecode<JWTPayload>(token);

    //check if token is expired
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }

    return {
      id: decoded[CLAIMS.NAME_IDENTIFIER],
      email: decoded[CLAIMS.EMAIL],
      role: decoded[CLAIMS.ROLE],
      name: decoded[CLAIMS.NAME],
    };
  } catch (error) {
    console.error("Token decode error:", error);
    removeToken();
    return null;
  }
}

export function getUserId(): string | null {
  return getCurrentUser()?.id || null;
}

export function isTokenExpired(): boolean {
  const token = getToken();
  const decoded = jwtDecode<JWTPayload>(token || "");
  if (decoded.exp * 1000 < Date.now()) {
    return true;
  }
  return false;
}

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export {client}
