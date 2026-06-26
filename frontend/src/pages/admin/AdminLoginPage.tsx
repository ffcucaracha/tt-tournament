import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginAdmin } from "../../api/authApi";
import { useAuth } from "../../features/auth";
import { AppLayout } from "../../layouts/AppLayout";

export function AdminLoginPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    try {
      setLoading(true);
      const response = await loginAdmin({ email, password });
      auth.setSession(response.accessToken, response.admin.email);
      const from =
        (location.state as { from?: string } | null)?.from ??
        new URLSearchParams(location.search).get("from") ??
        "/admin/participants";
      navigate(from, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-panel/90 p-6">
        <h1 className="mb-4 text-2xl font-semibold text-textMain">Вход администратора</h1>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block">
            <span className="text-xs text-textMuted">Email</span>
            <input
              className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-textMain"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-textMuted">Пароль</span>
            <input
              className="mt-1 w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-textMain"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button
            className="w-full rounded-md border border-accent/60 bg-accent/10 py-2 text-accent"
            disabled={loading}
            type="submit"
          >
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-textMuted">{message}</p> : null}
      </div>
    </AppLayout>
  );
}
