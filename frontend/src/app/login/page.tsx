"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const refreshCart = useCartStore((s) => s.refresh);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { role } = await login(email, password);
      await refreshCart();
      if (role === "admin") {
        router.push("/admin");
      } else {
        router.push("/account");
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page grid min-h-[70vh] place-items-center py-12">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold text-secondary dark:text-white">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sign in to your SmartComputers account.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input required type="email" placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input required type="password" placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-semibold text-primary">
            Create one
          </Link>
        </p>
        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          Demo: demo@smartcomputers.ke / demo12345
        </div>
      </div>
    </div>
  );
}
