// apps/web/src/app/api/cases/bulk/route.ts
import { NextResponse } from "next/server";
import { Prisma, prisma } from "@caseflow/db";
import { auth } from "@/app/api/auth/[...nextauth]/route";

interface ImportRow {
  caseId: string;
  applicantName: string;
  dob: string;
  email?: string;
  phone?: string;
  category: string;
  priority: string;
}

interface FailedRow {
  rowIndex: number;
  data: ImportRow;
  errors: string[];
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const rows: ImportRow[] = await request.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
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

  const chunkSize = 50;
  const failedRows: FailedRow[] = [];
  let successCount = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const prismaData = chunk.map((row) => ({
      caseId: row.caseId,
      applicantName: row.applicantName,
      dob: new Date(row.dob),
      email: row.email || null,
      phone: row.phone || null,
      category: row.category as any,
      priority: row.priority as any,
      createdById: userId,
    }));

    try {
      const result = await prisma.case.createMany({
        data: prismaData,
        skipDuplicates: true,
      });

      successCount += result.count;

      const createdCases = await prisma.case.findMany({
        where: {
          caseId: { in: chunk.map((r) => r.caseId) },
          createdById: userId,
        },
        select: { id: true },
        take: result.count,
      });

      if (createdCases.length > 0) {
        await prisma.caseLog.createMany({
          data: createdCases.map((c) => ({
            caseId: c.id,
            action: "CREATED",
            actorId: userId,
          })),
          skipDuplicates: true,
        });
      }
    } catch (error: any) {
      chunk.forEach((row, idx) => {
        failedRows.push({
          rowIndex: i + idx + 2,
          data: row,
          errors: [error.message || "Database error"],
        });
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
    importLogId: importLog.id,
    total: rows.length,
    imported: successCount,
    failed: failedCount,
    hasErrors: failedCount > 0,
  });
}