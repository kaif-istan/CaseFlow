// // apps/web/src/app/(dashboard)/import/page.tsx

import { requireAuth } from "@/lib/auth"
import { ImportUpload } from "@/components/import-upload"
import { ImportGrid } from "@/components/ImportGrid"
// import ImportPageClient from "./ImportPageClient"

// export default async function ImportPage() {
//   await requireAuth(["ADMIN", "OPERATOR"])

//   return <ImportPageClient />
// }


// apps/web/src/app/(dashboard)/import/page.tsx
// import { requireAuth } from "@/lib/auth"
// import TanStackImportPage from "./TanStackImportPage"


// export default async function ImportPage() {
//   await requireAuth(["ADMIN", "OPERATOR"])

//   return <TanStackImportPage />
// }

// apps/web/src/app/(dashboard)/import/page.tsx
import { ColumnMappingSheet } from "@/components/ColumnMappingSheet"
// ... other imports

export default async function ImportPage() {
  await requireAuth(["ADMIN", "OPERATOR"])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import Cases</h1>
        <p className="text-muted-foreground">Upload → Map → Review → Submit</p>
      </div>

      <ImportUpload />
      <ImportGrid />
      <ColumnMappingSheet />  {/* ← This opens automatically */}
    </div>
  )
}