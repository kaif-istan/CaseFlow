// apps/web/src/components/ImportSubmitWrapper.tsx
"use client"

import { useAppSelector } from "@/store/hooks"
import { ImportSubmit } from "@/components/ImportSubmit"

export function ImportSubmitWrapper() {
  const { rawRows, validationErrors, parsedAt } = useAppSelector((s) => s.import.present)

  const hasData = parsedAt && rawRows.length > 0
  const hasValidRows = hasData && Object.keys(validationErrors).length < rawRows.length

  if (!hasValidRows) return null

  return (
    <section className="border-t pt-12 mt-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold">Ready to Import</h2>
        <p className="text-muted-foreground mt-2">
          All validations passed — time to create cases
        </p>
      </div>
      <ImportSubmit />
    </section>
  )
}