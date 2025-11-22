// Example: apps/web/src/app/import/page.tsx
import { requireAuth } from "@/lib/auth";

export default async function ImportPage() {
  const session = await requireAuth(["ADMIN", "OPERATOR"]);
  return <div>Hello {session.user.email} ({session.user.role})</div>;
}