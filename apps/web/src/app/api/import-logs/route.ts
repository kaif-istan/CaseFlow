// apps/web/src/app/api/import-logs/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@caseflow/db"

export async function GET() {
  const imports = await prisma.importLog.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      createdBy: {
        select: { name: true, email: true }
      }
    }
  })

  return NextResponse.json({ imports })
}