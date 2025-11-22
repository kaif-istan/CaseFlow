// apps/web/src/lib/auth.ts
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

export async function requireAuth(allowedRoles?: ("ADMIN" | "OPERATOR")[]) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return session;
}