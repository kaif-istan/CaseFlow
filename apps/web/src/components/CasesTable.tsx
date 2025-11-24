// apps/web/src/components/CasesTable.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

type Case = {
  id: string
  caseId: string
  applicantName: string
  email: string | null
  category: string
  priority: string
  createdAt: string
}

type PageInfo = {
  hasNextPage: boolean
  hasPreviousPage: boolean
  startCursor: string | null
  endCursor: string | null
}

type CasesResponse = {
  cases: Case[]
  pageInfo: PageInfo
  totalCount: number
}

const PRIORITY_COLORS = {
  HIGH: "bg-red-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-green-500",
}

export function CasesTable({ initialSearchParams }: { initialSearchParams: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<CasesResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const search = searchParams.get("search") || ""
  const category = searchParams.get("category") || "all"
  const priority = searchParams.get("priority") || "all"
  const after = searchParams.get("after") || ""
  const before = searchParams.get("before") || ""

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    router.push(`?${params.toString()}`)
  }

  useEffect(() => {
    const fetchCases = async () => {
      setLoading(true)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (category !== "all") params.set("category", category)
      if (priority !== "all") params.set("priority", priority)
      if (after) params.set("after", after)
      if (before) params.set("before", before)

      const res = await fetch(`/api/cases?${params}`)
      const json = await res.json()
      setData(json)
      setLoading(false)
    }

    fetchCases()
  }, [search, category, priority, after, before])

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="h-64 w-full" /></div>
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name, email, or case ID..."
          value={search}
          onChange={(e) => updateQuery({ search: e.target.value, after: "", before: "" })}
          className="sm:max-w-sm"
        />
        <Select value={category} onValueChange={(v) => updateQuery({ category: v, after: "", before: "" })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="TAX">TAX</SelectItem>
            <SelectItem value="LICENSE">LICENSE</SelectItem>
            <SelectItem value="PERMIT">PERMIT</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={(v) => updateQuery({ priority: v, after: "", before: "" })}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {data.totalCount.toLocaleString()} total cases
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Case ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Applicant</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.cases.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4 font-mono text-sm">{c.caseId}</td>
                <td className="px-6 py-4">{c.applicantName}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{c.email || "—"}</td>
                <td className="px-6 py-4">
                  <Badge variant="outline">{c.category}</Badge>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block w-3 h-3 rounded-full ${PRIORITY_COLORS[c.priority as keyof typeof PRIORITY_COLORS] || "bg-gray-400"}`} />
                  <span className="ml-2">{c.priority}</span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {format(new Date(c.createdAt), "MMM d, yyyy")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          disabled={!data.pageInfo.hasPreviousPage}
          onClick={() => updateQuery({ before: data.pageInfo.startCursor!, after: "", search: "", category: "", priority: "" })}
        >
          ← Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Showing {data.cases.length} of {data.totalCount}
        </span>
        <Button
          variant="outline"
          disabled={!data.pageInfo.hasNextPage}
          onClick={() => updateQuery({ after: data.pageInfo.endCursor!, before: "" })}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}