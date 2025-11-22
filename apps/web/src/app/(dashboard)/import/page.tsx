// apps/web/src/app/(dashboard)/import/page.tsx

import { requireAuth } from "@/lib/auth"
import ImportPageClient from "./ImportPageClient"

export default async function ImportPage() {
  await requireAuth(["ADMIN", "OPERATOR"])

  return <ImportPageClient />
}
