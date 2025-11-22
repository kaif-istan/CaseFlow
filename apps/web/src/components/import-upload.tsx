// apps/web/src/components/import-upload.tsx
"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAppDispatch } from "@/store/hooks"
import { startParsing, setParsedData } from "@/store/importSlice"

export function ImportUpload() {
  const dispatch = useAppDispatch()
  const [uploadError, setUploadError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setUploadError(null)
    dispatch(startParsing())

    const reader = new FileReader()

    reader.onload = (e) => {
      const text = e.target?.result as string

      const worker = new Worker(new URL("@/lib/workers/csvWorker.ts", import.meta.url), {
        type: "module",
      })

      worker.onmessage = (e) => {
        const result = e.data
        console.log("Worker result:", result)

        if (result.error) {
          setUploadError(result.error)
        } else {
          dispatch(setParsedData(result))
        }
        worker.terminate()
      }

      worker.onerror = (err) => {
        console.error("Worker error:", err)
        setUploadError("Parse failed")
        worker.terminate()
      }

      // Send raw CSV text — 100% transferable!
      worker.postMessage(text)
    }

    reader.onerror = () => {
      setUploadError("Failed to read file")
    }

    reader.readAsText(file)
  }, [dispatch])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  })

  return (
    <Card className="p-10">
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
      </CardHeader>
      <CardContent>
        {uploadError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">
            {isDragActive ? "Drop your CSV here" : "Drag & drop your CSV file here"}
          </p>
          <p className="text-sm text-muted-foreground mt-2">or click to browse</p>
          <Button type="button" variant="outline" className="mt-6">
            <FileText className="mr-2 h-4 w-4" />
            Select CSV File
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}