"use client";
import { signIn } from "next-auth/react";

export function LoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      className="w-full inline-flex items-center justify-center gap-3 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm font-medium hover:bg-black/5 transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.6 20.5H42V20.5H24v7.5h11.3C33.9 32.6 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.3-5.3C33.6 6.5 29.1 4.5 24 4.5 13.5 4.5 5 13 5 23.5S13.5 42.5 24 42.5s19-8.5 19-19c0-1.3-.1-2.7-.4-4z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.2 4.5C14.3 15.1 18.8 12 24 12c3.1 0 5.9 1.2 8 3.1l5.3-5.3C33.6 6.5 29.1 4.5 24 4.5c-7.7 0-14.4 4.4-17.7 10.2z" />
        <path fill="#4CAF50" d="M24 42.5c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.2-7.2 2.2-5.3 0-9.8-3.4-11.5-8.2l-6.4 4.9C9.5 38 16.1 42.5 24 42.5z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20.5H24v7.5h11.3c-1 3-3.2 5.5-6.1 7.1l6.2 5.2C39.4 37.1 43 31.6 43 24c0-1.3-.1-2.7-.4-3.5z" />
      </svg>
      เข้าสู่ระบบด้วย Google
    </button>
  );
}
