"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export default function RegisterPage() {
  const router = useRouter();
  const registerUser = useAuthStore((s) => s.register);
  const refreshCart = useCartStore((s) => s.refresh);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerUser(form);
      await refreshCart();
      router.push("/account");
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Join SmartComputers for faster checkout and order tracking.
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <input required placeholder="First name" className="input" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            <input required placeholder="Last name" className="input" value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </div>
          <input required type="email" placeholder="Email" className="input" value={form.email} onChange={(e) => update("email", e.target.value)} />
          <input placeholder="Phone (optional)" className="input" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          <input required type="password" placeholder="Password (min 8 chars)" className="input" value={form.password} onChange={(e) => update("password", e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
