import { createContext, ReactNode, useContext, useMemo, useState } from "react";

const TOKEN_KEY = "admin_access_token";
const ADMIN_EMAIL_KEY = "admin_email";

interface AuthState {
  token: string | null;
  email: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  setSession: (token: string, email: string) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>(() => ({
    token: window.localStorage.getItem(TOKEN_KEY),
    email: window.localStorage.getItem(ADMIN_EMAIL_KEY)
  }));

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.token),
      setSession: (token: string, email: string) => {
        window.localStorage.setItem(TOKEN_KEY, token);
        window.localStorage.setItem(ADMIN_EMAIL_KEY, email);
        setState({ token, email });
      },
      clearSession: () => {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(ADMIN_EMAIL_KEY);
        setState({ token: null, email: null });
      }
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
