// apps/web/src/components/ImportHistoryTable.tsx
"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, User, CheckCircle2, XCircle, Clock } from "lucide-react"

type ImportLog = {
  id: string
  totalRows: number
  successCount: number
  failedCount: number
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"
  startedAt: string
  finishedAt: string | null
  errorReport: any | null
  createdBy: {
    name: string | null
    email: string
  }
}

const STATUS_BADGE = {
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  PROCESSING: "bg-yellow-500",
  PENDING: "bg-gray-500",
}

export function ImportHistoryTable() {
  const [imports, setImports] = useState<ImportLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/import-logs")
      .then(r => r.json())
      .then(data => {
        setImports(data.imports)
        setLoading(false)
      })
  }, [])

  const downloadErrorReport = async (logId: string, errorReport: any) => {
    if (!errorReport) return

    const rows = JSON.parse(errorReport)
    const csv = [
      ["Row", "caseId", "applicantName", "email", "Error"],
      ...rows.map((r: any) => [
        r.rowIndex,
        r.data.caseId || "",
        r.data.applicantName || "",
        r.data.email || "",
        r.errors.join(" | "),
      ])
    ].map(r => r.join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `import-errors-${logId}.csv`
    a.click()
  }

  if (loading) {
    return <div className="space-y-4"><div className="h-32 bg-muted animate-pulse rounded" /></div>
  }

  return (
    <div className="space-y-6">
      {imports.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">No imports yet</p>
          </CardContent>
        </Card>
      ) : (
        imports.map((imp) => (
          <Card key={imp.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${STATUS_BADGE[imp.status]}`} />
                  <div>
                    <p className="font-semibold text-lg">
                      Import • {format(new Date(imp.startedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {imp.createdBy.name || imp.createdBy.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {imp.status === "COMPLETED" && imp.failedCount > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadErrorReport(imp.id, imp.errorReport)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Error Report ({imp.failedCount})
                    </Button>
                  )}
                  <Badge variant={imp.status === "COMPLETED" ? "default" : imp.status === "FAILED" ? "destructive" : "secondary"}>
                    {imp.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{imp.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{imp.successCount}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Success
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{imp.failedCount}</p>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4" />
                    Failed
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {imp.finishedAt ? (
                      format(new Date(imp.finishedAt), "h:mm:ss a")
                    ) : (
                      <Clock className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {imp.finishedAt ? "Finished" : "Running"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}