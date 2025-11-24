// apps/web/src/app/api/cases/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@caseflow/db";

const PAGE_SIZE = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category");
  const priority = searchParams.get("priority");
  const after = searchParams.get("after");
  const before = searchParams.get("before");

  const where: any = {};

  if (search) {
    where.OR = [
      { caseId: { contains: search, mode: "insensitive" } },
      { applicantName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category && category !== "all") where.category = category;
  if (priority && priority !== "all") where.priority = priority;

  const take = after ? PAGE_SIZE + 1 : before ? -(PAGE_SIZE + 1) : PAGE_SIZE;
  const skip = after || before ? 1 : 0;

  const cases = await prisma.case.findMany({
    where,
    take,
    skip,
    orderBy: { createdAt: "desc" },
    cursor: after ? { id: after } : before ? { id: before } : undefined,
  });

  let hasNextPage = false;
  let hasPreviousPage = !!before;
  let startCursor: string | null = null;
  let endCursor: string | null = null;

  if (after && cases.length > PAGE_SIZE) {
    hasNextPage = true;
    cases.pop();
  }
  if (before && cases.length > PAGE_SIZE) {
    cases.shift();
  }

  if (cases.length > 0) {
    startCursor = cases[0]?.id || null;
    endCursor = cases[cases.length - 1]?.id || null;
  }

  const totalCount = await prisma.case.count({ where });

  return NextResponse.json({
    cases,
    pageInfo: { hasNextPage, hasPreviousPage, startCursor, endCursor },
    totalCount,
  });
}
