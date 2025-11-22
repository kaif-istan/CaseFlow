"use client"
import { ImportUpload } from "@/components/import-upload"
import { ImportGrid } from "@/components/ImportGrid"
import { useAppSelector } from "@/store/hooks"

export default function TanStackImportPage() {
    const { parsedAt } = useAppSelector((s) => s.import)

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Import Cases</h1>
                <p className="text-muted-foreground">Upload → Map → Review → Submit</p>
            </div>

            {!parsedAt ? <ImportUpload /> : <ImportGrid />}
        </div>
    )
}
