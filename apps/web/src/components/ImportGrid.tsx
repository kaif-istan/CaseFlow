// apps/web/src/components/ImportGrid.tsx
"use client"
import React from "react"
import { useRef, useMemo } from "react"
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { updateCell, fixAll } from "@/store/importSlice"
import type { CaseRow } from "@caseflow/types"
import { Undo2, Redo2 } from "lucide-react"
import { CellContext } from "@tanstack/react-table"

type RowWithIndex = any & { __rowIndex__: number }

export function ImportGrid() {
    const dispatch = useAppDispatch()
    const { rawRows, headers } = useAppSelector((s) => s.import.present)
    const { columnMapping, editedRows, validationErrors } = useAppSelector((s) => s.import.present)

    // Combine raw + edited data
    const data = useMemo(() => {
        return rawRows.map((row: any, index: number) => ({
            ...row,
            ...editedRows[index],
            __rowIndex__: index,
        }))
    }, [rawRows, editedRows])

    // Build columns from mapping
    const columns = useMemo<ColumnDef<RowWithIndex>[]>(() => {
        if (Object.keys(columnMapping).length === 0) {
            return [
                {
                    header: "No columns mapped yet",
                    accessorFn: () => "Map columns in the next step →",
                },
            ]
        }

        return Object.entries(columnMapping).map(([targetField, csvHeader]) => {
            if (!csvHeader) return null
            const field = targetField as keyof CaseRow

            return {
                accessorKey: field,
                header: () => (
                    <div className="font-medium">
                        ← {csvHeader}
                        <span className="text-xs text-muted-foreground ml-2">← {csvHeader}</span>
                    </div>
                ),
                cell: ({ row }: CellContext<RowWithIndex, unknown>) => {
                    const value = row.getValue(csvHeader) as string
                    const rowIndex = row.original.__rowIndex__
                    const errors = validationErrors[rowIndex]?.[field]

                    return (
                        <div className="relative">
                            <Input
                                defaultValue={value}
                                onBlur={(e) => {
                                    const newValue = e.target.value
                                    if (newValue !== value) {
                                        dispatch(updateCell({ rowIndex, field, value: newValue }))
                                    }
                                }}
                                className={`border-0 focus-visible:ring-1 h-9 ${errors ? "bg-red-50 focus-visible:ring-red-500" : ""
                                    }`}
                            />
                            {errors && (
                                <Badge variant="destructive" className="absolute -top-6 left-0 text-xs">
                                    {errors[0]} {/* Show only first error */}
                                </Badge>
                            )}
                        </div>
                    )
                },
            }
        }).filter(Boolean) as ColumnDef<RowWithIndex>[]
    }, [columnMapping, validationErrors, dispatch])

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const { rows } = table.getRowModel()
    const parentRef = useRef<HTMLDivElement>(null)

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 44,
        overscan: 20,
    })

    const virtualRows = virtualizer.getVirtualItems()
    const totalSize = virtualizer.getTotalSize()

    // Error summary
    const totalErrors = Object.values(validationErrors).reduce((sum, errs) =>
        sum + Object.values(errs).flat().length, 0
    )
    const canSubmit = totalErrors === 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Review & Edit Data</h2>
                    <p className="text-muted-foreground">
                        {rawRows.length.toLocaleString()} rows • {totalErrors} validation errors
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Undo2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                        <Redo2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {totalErrors > 0 && (
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                    <h3 className="font-medium text-orange-900">Fix common issues</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dispatch(fixAll({ field: "priority", value: "MEDIUM" }))}
                        >
                            Set all priority → MEDIUM
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dispatch(fixAll({ field: "category", value: "TAX" }))}
                        >
                            Set all category → TAX
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-lg border bg-card">
                <div
                    ref={parentRef}
                    className="h-96 w-full overflow-auto"
                    style={{ contain: "strict" }}
                >
                    <table className="w-full">
                        <thead className="sticky top-0 bg-muted/50 z-10">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th key={header.id} className="px-4 py-3 text-left text-sm font-medium">
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            <tr style={{ height: virtualRows[0]?.start ?? 0 }} />
                            {virtualRows.map((virtualRow) => {
                                const row = rows[virtualRow.index]
                                if (!row) return null
                                return (
                                    <tr key={row.id} data-index={virtualRow.index}>
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-2 border-t">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                            <tr style={{ height: totalSize - (virtualRows[virtualRows.length - 1]?.end ?? 0) }} />
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end">
                <Button size="lg" disabled={!canSubmit}>
                    Submit {rawRows.length.toLocaleString()} Cases
                </Button>
            </div>
        </div>
    )
}