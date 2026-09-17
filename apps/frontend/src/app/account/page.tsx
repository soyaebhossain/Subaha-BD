'use client';

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { authLogin, authLogout, authMe, authRegister } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/auth";
import { useUserStore } from "@/store/user.store";

type Mode = "login" | "register";

export default function AccountPage() {
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);
  const setAuth = useUserStore((state) => state.setAuth);
  const setUser = useUserStore((state) => state.setUser);
  const logoutStore = useUserStore((state) => state.logout);

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loadingProfile = Boolean(token && !user);

  useEffect(() => {
    if (!token || user) return;
    let active = true;
    authMe(token).then((data) => {
      if (!active) return;
      if (data) setUser(data);
    });
    return () => {
      active = false;
    };
  }, [token, user, setUser]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    const payload = { email, password, name };

    const response =
      mode === "login" ? await authLogin(payload) : await authRegister(payload);

    if (response?.token && response?.user) {
      setAuth(response.token, response.user);
      setAccessToken(response.token);
      setMessage("Signed in.");
      setPassword("");
    } else {
      setMessage("Could not authenticate. Please check credentials.");
    }
    setIsSubmitting(false);
  }

  async function handleLogout() {
    if (token) {
      await authLogout(token);
    }
    logoutStore();
    clearAccessToken();
    setMessage("Signed out.");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Account</h1>
          <p className="text-sm text-slate-600">
            Sign in to manage your orders and checkout faster.
          </p>
        </div>
        <Link
          href="/account/orders"
          className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          My orders
        </Link>
      </div>

      {user ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {user.name ?? "Customer"}
              </div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
          <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Signed in. Your orders and checkout will use this profile.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-3 py-1 ${
                mode === "login"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`rounded-full px-3 py-1 ${
                mode === "register"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {mode === "register" && (
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Name</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  placeholder="Your name"
                  required
                />
              </label>
            )}
            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="********"
                required
              />
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting
                ? "Processing..."
                : mode === "login"
                  ? "Login"
                  : "Create account"}
            </button>
            {loadingProfile && (
              <p className="text-xs text-slate-500">Loading profile...</p>
            )}
            {message && (
              <p className="text-xs font-medium text-amber-700">{message}</p>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
