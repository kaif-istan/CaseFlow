import { CasesTable } from "@/components/CasesTable"
import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic";

export const metadata = {
    title: "Cases",
}

export default async function CasesPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    await requireAuth(["ADMIN", "OPERATOR"])

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight">Cases</h1>
                <p className="text-muted-foreground mt-2">
                    Manage and search all imported cases
                </p>
            </div>

            <CasesTable initialSearchParams={searchParams} />
        </div>
    )
}
