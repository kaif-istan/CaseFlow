// apps/web/src/app/api/cases/bulk/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@caseflow/db"
import { auth } from "@/app/api/auth/[...nextauth]/route" // ← This is correct

export async function POST(request: Request) {
  const session = await auth() // ← This is the NEW way in v5

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await request.json()

  try {
    const result = await prisma.case.createMany({
      data,
      skipDuplicates: true,
    })

    return NextResponse.json({ success: true, imported: result.count })
  } catch (error: any) {
    console.error("Bulk import failed:", error)
    return NextResponse.json(
      { error: error.message || "Failed to import cases" },
      { status: 500 }
    )
  }
}