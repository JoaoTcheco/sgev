export type Role = "admin" | "pharmacist" | "cashier";

export interface SessionUser {
  id: string;
  email: string;
  full_name: string | null;
  active: number;
  roles: Role[];
}

export interface ApiResult<T> {
  data: T | null;
  error: { message: string } | null;
}

export interface ApiBridge {
  auth: {
    login: (email: string, password: string) => Promise<ApiResult<SessionUser>>;
    logout: () => Promise<ApiResult<{ ok: true }>>;
    currentUser: () => Promise<ApiResult<SessionUser | null>>;
    changePassword: (
      oldPassword: string,
      newPassword: string,
    ) => Promise<ApiResult<{ ok: true }>>;
    needsBootstrap: () => Promise<ApiResult<{ needsBootstrap: boolean }>>;
    bootstrap: (data: {
      email: string;
      password: string;
      fullName: string;
    }) => Promise<ApiResult<SessionUser>>;
  };
  users: {
    list: () => Promise<ApiResult<SessionUser[]>>;
    create: (data: {
      email: string;
      password: string;
      fullName: string;
      role: Role;
    }) => Promise<ApiResult<SessionUser>>;
    update: (data: {
      userId: string;
      fullName?: string;
      email?: string;
    }) => Promise<ApiResult<SessionUser>>;
    setRole: (userId: string, role: Role) => Promise<ApiResult<SessionUser>>;
    setActive: (
      userId: string,
      active: boolean,
    ) => Promise<ApiResult<SessionUser>>;
    resetPassword: (
      userId: string,
      password: string,
    ) => Promise<ApiResult<{ ok: true }>>;
    remove: (userId: string) => Promise<ApiResult<{ ok: true }>>;
  };
  settings: {
    get: () => Promise<ApiResult<any>>;
    save: (data: any) => Promise<ApiResult<any>>;
  };
  audit: {
    list: (limit?: number) => Promise<ApiResult<any[]>>;
  };
}

declare global {
  interface Window {
    api: ApiBridge;
  }
}

export const api = window.api;

export async function unwrap<T>(p: Promise<ApiResult<T>>): Promise<T> {
  const r = await p;
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}
