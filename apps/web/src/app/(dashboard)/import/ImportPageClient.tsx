"use client"

import { ImportUpload } from "@/components/import-upload"
import { useAppSelector } from "@/store/hooks"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function ImportPageClient() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Import Cases</h1>
                <p className="text-muted-foreground">Upload a CSV file to create new cases</p>
            </div>

            <ImportUpload />
            <PreviewTable />
        </div>
    )
}

// In import/page.tsx → PreviewTable component
function PreviewTable() {
  const { headers, rawRows, totalRows, parsedAt, parsing, error } = useAppSelector((s) => s.import)

  if (parsing) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-muted-foreground">Parsing CSV...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Parse error: {error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!parsedAt) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview ({totalRows.toLocaleString()} rows loaded)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-auto max-h-[400px]">
          <table className="w-full text-sm">
            <thead className="bg-muted sticky top-0">
              <tr>
                {headers.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rawRows.slice(0, 100).map((row, i) => (
                <tr key={i} className="border-t hover:bg-muted/50">
                  {headers.map((h) => (
                    <td key={h} className="px-4 py-3 max-w-[200px] truncate">
                      {String(row[h] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalRows > 100 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Showing first 100 of {totalRows.toLocaleString()} rows
          </p>
        )}
      </CardContent>
    </Card>
  )
}