import { requireAuth } from "@/lib/auth"

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
    const session = await requireAuth()

    return (
        <div>
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground mt-2">
                You are logged in as <strong>{session.user.email}</strong> ({session.user.role})
            </p>
        </div>
    )
}
