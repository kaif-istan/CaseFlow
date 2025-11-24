// apps/web/src/app/(dashboard)/import-history/page.tsx
import { requireAuth } from "@/lib/auth"
import { ImportHistoryTable } from "@/components/ImportHistoryTable"

export const metadata = {
    title: "Import History",
}

export default async function ImportHistoryPage() {
    await requireAuth(["ADMIN", "OPERATOR"])

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Import History</h1>
                <p className="text-muted-foreground mt-2">
                    View all past imports and download error reports
                </p>
            </div>

            <ImportHistoryTable />
        </div>
    )
}