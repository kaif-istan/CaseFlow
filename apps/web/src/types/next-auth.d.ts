import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      role: "ADMIN" | "OPERATOR";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "OPERATOR";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: "ADMIN" | "OPERATOR";
  }
}
