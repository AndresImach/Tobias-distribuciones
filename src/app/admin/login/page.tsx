"use client";

import { useActionState } from "react";
import { LayoutDashboard, LogIn } from "lucide-react";
import { login, type LoginState } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined,
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-3">
            <LayoutDashboard size={24} />
          </div>
          <h1 className="text-lg font-bold text-gray-800">Panel de administración</h1>
          <p className="text-sm text-gray-500 mt-1">Ingresá para continuar</p>
        </div>

        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition-colors"
          >
            <LogIn size={16} />
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
