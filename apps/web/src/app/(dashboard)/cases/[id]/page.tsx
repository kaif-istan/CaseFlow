// apps/web/src/app/(dashboard)/cases/[id]/page.tsx
import { requireAuth } from "@/lib/auth"
import { prisma } from "@caseflow/db"
import { CaseDetails } from "@/components/CaseDetails"

export const metadata = {
    title: "Case Details",
}

export default async function CasePage({ params }: { params: { id: string } }) {
    await requireAuth(["ADMIN", "OPERATOR"])

    const caseData = await prisma.case.findUnique({
        where: { id: params.id },
        include: {
            logs: {
                include: { actor: { select: { name: true, email: true } } },
                orderBy: { createdAt: "desc" },
            },
        },
    })

    if (!caseData) {
        return <div>Case not found</div>
    }

    return <CaseDetails case={caseData} />
}