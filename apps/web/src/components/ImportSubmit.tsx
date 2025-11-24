// apps/web/src/components/ImportSubmit.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { resetImport } from "@/store/importSlice"
import { Upload, Download, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"

interface FailedRow {
  rowIndex: number
  data: Record<string, string>
  errors: string[]
}

export function ImportSubmit() {
  const dispatch = useAppDispatch()
  const { rawRows, editedRows, columnMapping, validationErrors, headers } = useAppSelector(s => s.import.present)

  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)
  const [failedRows, setFailedRows] = useState<FailedRow[]>([])

  // Only count rows that pass validation
  const validRows = rawRows.filter((_, i) => !validationErrors[i])
  const totalValid = validRows.length

  const preparePayload = () => {
    return validRows.map((rawRow, idx) => {
      const originalIndex = rawRows.indexOf(rawRow)
      const edited = editedRows[originalIndex] || {}
      const row: any = {}

      Object.entries(columnMapping).forEach(([target, source]) => {
        if (source) {
          row[target] = edited[target as keyof typeof edited] ?? rawRow[source] ?? ""
        }
      })

      return row
    })
  }

  const uploadChunk = async (chunk: any[]) => {
    const res = await fetch("/api/cases/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Server error" }))
      throw new Error(err.error || `HTTP ${res.status}`)
    }

    return await res.json()
  }

  const handleSubmit = async () => {
    if (totalValid === 0) return

    setStatus("uploading")
    setProgress(0)
    setFailedRows([])

    const payload = preparePayload()
    const chunkSize = 50
    let uploaded = 0
    const failed: FailedRow[] = []

    for (let i = 0; i < payload.length; i += chunkSize) {
      const chunk = payload.slice(i, i + chunkSize)
      const startValidIndex = i

      try {
        await uploadChunk(chunk)
        uploaded += chunk.length
        setProgress((uploaded / totalValid) * 100)
      } catch (err: any) {
        // Map back to original row indices
        chunk.forEach((_, chunkIdx) => {
          const validRowIndex = startValidIndex + chunkIdx
          const originalRowIndex = rawRows.indexOf(validRows[validRowIndex])
          failed.push({
            rowIndex: originalRowIndex + 2, // +2 for header + 1-based
            data: payload[startValidIndex + chunkIdx],
            errors: [err.message],
          })
        })
      }
    }

    if (failed.length === 0) {
      setStatus("success")
      setTimeout(() => dispatch(resetImport()), 3000)
    } else {
      setStatus("error")
      setFailedRows(failed)
    }
  }

  const downloadErrors = () => {
    const csv = [
      ["Row", "case_id", "applicant_name", "email", "Error"],
      ...failedRows.map(f => [
        f.rowIndex,
        f.data.case_id || "",
        f.data.applicant_name || "",
        f.data.email || "",
        f.errors.join(" | "),
      ])
    ].map(r => r.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `import-errors-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  if (status === "success") {
    return (
      <div className="text-center py-20">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h2 className="text-3xl font-bold">Import Complete!</h2>
        <p className="text-xl text-muted-foreground mt-4">
          {totalValid.toLocaleString()} cases imported successfully
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Ready to Import</h2>
        <p className="text-xl text-muted-foreground mt-2">
          {totalValid.toLocaleString()} valid rows will be imported
        </p>
      </div>

      {status === "uploading" && (
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-4" />
        </div>
      )}

      {status === "error" && failedRows.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-4">
            <p>
              {(totalValid - failedRows.length).toLocaleString()} imported • {failedRows.length} failed
            </p>
            <Button onClick={downloadErrors} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Error Report (.csv)
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={status === "uploading" || totalValid === 0}
          className="px-12"
        >
          {status === "uploading" ? (
            <>Uploading...</>
          ) : (
            <>Import {totalValid.toLocaleString()} Cases</>
          )}
        </Button>
      </div>
    </div>
  )
}