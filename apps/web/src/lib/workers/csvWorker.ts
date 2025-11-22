// apps/web/src/lib/workers/csvWorker.ts
import Papa from "papaparse"

self.onmessage = (e: MessageEvent<string>) => {
  const csvText = e.data

  if (typeof csvText !== "string" || csvText.length === 0) {
    self.postMessage({ data: [], headers: [], totalRows: 0, error: "Empty CSV" })
    return
  }

  Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    complete: (result) => {
      if (result.errors.length > 0) {
        self.postMessage({
          data: [],
          headers: [],
          totalRows: 0,
          error: result.errors[0].message,
        })
        return
      }

      const headers = result.meta.fields || []
      const data = result.data as any[]

      self.postMessage({
        data,
        headers,
        totalRows: data.length,
      })
    },
    error: (error: Error) => {
      self.postMessage({
        data: [],
        headers: [],
        totalRows: 0,
        error: error.message,
      })
    },
  })
}