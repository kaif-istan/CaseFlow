// apps/web/src/app/(dashboard)/import/page.tsx

import { requireAuth } from "@/lib/auth"
import { ImportUpload } from "@/components/import-upload"
import { ImportGrid } from "@/components/ImportGrid"
import { ColumnMappingSheet } from "@/components/ColumnMappingSheet"
import { ImportSubmitWrapper } from "@/components/ImportSubmitWrapper"

export const metadata = {
  title: "Import Cases",
}

export default async function ImportPage() {
  await requireAuth(["ADMIN", "OPERATOR"])

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Import Cases</h1>
        <p className="text-muted-foreground mt-2">
          Upload → Map → Review → Submit
        </p>
      </div>

      <section className="mb-12">
        <ImportUpload />
      </section>

      <ColumnMappingSheet />

      <section className="mb-12">
        <ImportGrid />
      </section>

      {/* This is now a client component — safe to use hooks */}
      <ImportSubmitWrapper />
    </div>
  )
}