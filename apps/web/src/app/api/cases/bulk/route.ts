// apps/web/src/app/api/cases/bulk/route.ts
import { NextResponse } from "next/server";
import { Prisma, prisma } from "@caseflow/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const rows: any[] = await request.json(); // ← Accept any shape

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No data" }, { status: 400 });
  }

  const importLog = await prisma.importLog.create({
    data: {
      totalRows: rows.length,
      successCount: 0,
      failedCount: 0,
      status: "PROCESSING",
      createdById: userId,
      startedAt: new Date(),
    },
  });

  const failedRows: any[] = [];
  let successCount = 0;

  for (const [index, row] of rows.entries()) {
    try {
      const rawDob = row.dob || row.d_o_b || row.DateOfBirth;

      const dob = new Date(rawDob);
      if (isNaN(dob.getTime())) {
        throw new Error(`Invalid DOB: "${rawDob}"`);
      }

      const caseData = {
        caseId: (row.caseId || row.case_id)?.trim(),
        applicantName: (row.applicantName || row.applicant_name)?.trim(),
        dob,
        email: (row.email || "")?.trim() || null,
        phone: (row.phone || "")?.trim() || null,
        category: (row.category || "TAX") as any,
        priority: (row.priority || "MEDIUM") as any,
        createdById: userId,
      };

      // Optional: validate required fields
      if (!caseData.caseId) {
        throw new Error("Missing caseId");
      }
      if (!caseData.applicantName) {
        throw new Error("Missing applicantName");
      }
      if (isNaN(caseData.dob.getTime())) {
        throw new Error("Invalid dob format");
      }

      const createdCase = await prisma.case.create({ data: caseData });

      await prisma.caseLog.create({
        data: {
          caseId: createdCase.id,
          action: "CREATED",
          actorId: userId,
        },
      });

      successCount++;
    } catch (error: any) {
      failedRows.push({
        rowIndex: index + 2,
        data: row,
        errors: [error.message || "Unknown error"],
      });
    }
  }

  const failedCount = rows.length - successCount;

  await prisma.importLog.update({
    where: { id: importLog.id },
    data: {
      successCount,
      failedCount,
      status: "COMPLETED",
      errorReport: failedCount > 0 ? (failedRows as any) : Prisma.JsonNull,
      finishedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    total: rows.length,
    imported: successCount,
    failed: failedCount,
  });
}
