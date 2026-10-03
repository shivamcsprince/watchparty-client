import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.js";
import { authStorage } from "./storage.js";
import { disconnectSocket } from "../socket/socket.js";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [token, setToken] = useState(() => authStorage.getToken());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!token) {
        setReady(true);
        return;
      }
      try {
        const { user } = await authApi.me(token);
        if (!cancelled) setUser(user);
      } catch {
        if (!cancelled) {
          authStorage.clear();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    verify();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doLogin = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    authStorage.set(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const doRegister = useCallback(async (email, password, username) => {
    const res = await authApi.register({ email, password, username });
    authStorage.set(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const doLogout = useCallback(() => {
    disconnectSocket();
    authStorage.clear();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, ready, login: doLogin, register: doRegister, logout: doLogout }),
    [user, token, ready, doLogin, doRegister, doLogout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const v = useContext(AuthCtx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}