import { requireAuth } from "@/lib/auth"

export default async function UsersPage() {
    await requireAuth(["ADMIN"])

    return (
        <div className="container mx-auto py-10 px-4 max-w-7xl">
            <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight">Users</h1>
                <p className="text-muted-foreground mt-2">
                    Admin user management coming soon.
                </p>
            </div>
        </div>
    )
}