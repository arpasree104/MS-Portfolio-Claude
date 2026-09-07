import "server-only";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { callGas, GasCallError } from "./gas-server";
import type { Role, UserStatus } from "./types";

interface RegisterLoginResult {
  userId: string;
  role: Role;
  status: UserStatus;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      try {
        // Registers a 'pending' Users row on first-ever login; returns current role/status either way.
        await callGas<RegisterLoginResult>("registerLoginAttempt", null, {
          email: user.email,
          displayName: user.name || "",
        });
        return true; // always allow the OAuth handshake; role/status gating happens in middleware/layout
      } catch (err) {
        console.error("[auth] registerLoginAttempt failed", err);
        // Don't block login just because the whitelist check failed transiently;
        // downstream pages will still enforce access via GAS auth checks.
        return true;
      }
    },
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        token.email = user.email;
      }
      // Refresh role/status on every sign-in (and lazily thereafter) so an admin
      // approval takes effect without the user needing to fully log out.
      if (token.email && (!token.role || !token.status || trigger === "signIn" || trigger === "update")) {
        try {
          const result = await callGas<RegisterLoginResult>("registerLoginAttempt", null, {
            email: token.email,
            displayName: token.name || "",
          });
          token.userId = result.userId;
          token.role = result.role;
          token.status = result.status;
        } catch (err) {
          if (err instanceof GasCallError) {
            token.role = "student";
            token.status = "pending";
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.userId = (token.userId as string) || "";
        session.user.role = (token.role as Role) || "student";
        session.user.status = (token.status as UserStatus) || "pending";
      }
      return session;
    },
  },
};
