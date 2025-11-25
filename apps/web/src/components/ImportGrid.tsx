// apps/web/src/components/ImportGrid.tsx
"use client";

import React, { useRef, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  CellContext,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { CaseRow } from "@caseflow/types";
import { Undo2, Redo2, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { ActionCreators } from "redux-undo";
import { updateCell, fixAll } from "@/store/importEditSlice";

type RowWithIndex = any & { __rowIndex__: number };

const CHUNK_SIZE = 50;
const MAX_RETRIES = 3;

export function ImportGrid() {
  const dispatch = useAppDispatch();

  // Core import state (non-undoable)
  const { rawRows, columnMapping } = useAppSelector((s) => s.import);

  // Editable state (undoable)
  const { editedRows, validationErrors } = useAppSelector(
    (s) => s.importEdits.present
  );

  // Undo/redo availability
  const { canUndo, canRedo } = useAppSelector((s) => ({
    canUndo: s.importEdits.past.length > 0,
    canRedo: s.importEdits.future.length > 0,
  }));

  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const data = useMemo(() => {
    return rawRows.map((row: any, index: number) => ({
      ...row,
      ...editedRows[index],
      __rowIndex__: index,
    }));
  }, [rawRows, editedRows]);

  const columns = useMemo<ColumnDef<RowWithIndex>[]>(() => {
    if (Object.keys(columnMapping).length === 0) {
      return [
        {
          header: "No columns mapped yet",
          accessorFn: () => "Map columns first →",
        },
      ];
    }

    return Object.entries(columnMapping)
      .map(([targetField, csvHeader]) => {
        if (!csvHeader) return null;
        const field = targetField as keyof CaseRow;

        return {
          accessorKey: field,
          header: () => (
            <div className="font-medium">
              {targetField}
              <span className="text-xs text-muted-foreground ml-2">
                ← {csvHeader}
              </span>
            </div>
          ),
          cell: ({ row }: CellContext<RowWithIndex, unknown>) => {
            const value = row.original[field] as string;
            const rowIndex = row.original.__rowIndex__;
            const errors = validationErrors[rowIndex]?.[field];

            return (
              <div className="relative">
                <Input
                  defaultValue={value || ""}
                  onBlur={(e) => {
                    const newValue = e.target.value.trim();
                    if (newValue !== value) {
                      const rawRow = rawRows[rowIndex];
                      dispatch(
                        updateCell({
                          rowIndex,
                          field,
                          value: newValue,
                          rawRow,
                        })
                      );
                    }
                  }}
                  className={`border-0 focus-visible:ring-1 h-9 ${
                    errors ? "bg-red-50 focus-visible:ring-red-500" : ""
                  }`}
                />
                {errors && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-6 left-0 text-xs"
                  >
                    {errors[0]}
                  </Badge>
                )}
              </div>
            );
          },
        };
      })
      .filter(Boolean) as ColumnDef<RowWithIndex>[];
  }, [columnMapping, validationErrors, dispatch, rawRows]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
  const { rows } = table.getRowModel();
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 20,
  });

  const totalErrors = Object.values(validationErrors).reduce(
    (sum, errs) => sum + Object.values(errs).flat().length,
    0
  );
  const canSubmit = totalErrors === 0 && rawRows.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit || status === "uploading") return;

    setStatus("uploading");
    setProgress(0);
    setMessage("Starting import...");
    setFailedRows([]);

    const payload = rawRows.map((rawRow, index) => {
      const edited = editedRows[index] || {};
      const mapped: any = {};

      // Apply mapping UI
      Object.entries(columnMapping).forEach(([targetField, sourceHeader]) => {
        if (!sourceHeader) return;
        const value =
          edited[targetField as keyof typeof edited] ??
          rawRow[sourceHeader] ??
          "";
        mapped[targetField] = value;
      });

      // FALLBACKS FIX: If mapping UI fails, detect CSV headers automatically
      return {
        caseId:
          mapped.caseId?.trim() ||
          rawRow["case_id"]?.trim() ||
          rawRow["Case ID"]?.trim() ||
          rawRow["case id"]?.trim() ||
          null,

        applicantName:
          mapped.applicantName?.trim() ||
          rawRow["applicant_name"]?.trim() ||
          rawRow["Applicant Name"]?.trim() ||
          rawRow["applicant name"]?.trim() ||
          null,

        dob: mapped.dob || rawRow["dob"] || rawRow["DOB"] || null,

        email: (mapped.email || "").trim() || null,
        phone: (mapped.phone || "").trim() || null,
        category: mapped.category || "TAX",
        priority: mapped.priority || "MEDIUM",
      };
    });

    console.log("Final Payload:", payload);

    let uploaded = 0;
    const failed: any[] = [];

    for (let i = 0; i < payload.length; i += CHUNK_SIZE) {
      const chunk = payload.slice(i, i + CHUNK_SIZE);
      let attempts = 0;

      while (attempts < MAX_RETRIES) {
        try {
          const res = await fetch("/api/cases/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(chunk),
          });

          const result = await res.json();

          if (result.success) {
            uploaded += result.imported || chunk.length;
            break;
          } else {
            throw new Error(result.error || "Import failed");
          }
        } catch (err: any) {
          attempts++;
          if (attempts >= MAX_RETRIES) {
            chunk.forEach((row, idx) => {
              failed.push({
                rowIndex: i + idx + 2,
                data: row,
                errors: [err.message],
              });
            });
          }
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }

      setProgress(Math.round(((i + CHUNK_SIZE) / payload.length) * 100));
      setMessage(`Uploaded ${uploaded} of ${payload.length} cases...`);
    }

    if (failed.length === 0) {
      setStatus("success");
      setMessage(`Success! Imported ${uploaded} cases`);
      setTimeout(() => {
        window.location.href = "/import-history";
      }, 10000);
    } else {
      setStatus("error");
      setFailedRows(failed);
      setMessage(`Imported ${uploaded}, ${failed.length} failed`);
    }
  };

  const downloadErrors = () => {
    const csv = [
      "Row,Case ID,Applicant,Email,Error",
      ...failedRows.map(
        (f) =>
          `${f.rowIndex},"${f.data.caseId}","${f.data.applicantName}",${
            f.data.email || ""
          },"${f.errors.join(" | ")}"`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import-errors-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
  };

  if (status === "success") {
    return (
      <div className="text-center py-32">
        <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
        <h2 className="text-4xl font-bold">Import Complete!</h2>
        <p className="text-xl text-muted-foreground mt-4">
          Redirecting to Import History...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review & Edit Data</h2>
          <p className="text-muted-foreground">
            {rawRows.length.toLocaleString()} rows • {totalErrors} validation
            errors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(ActionCreators.undo())}
            disabled={!canUndo}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => dispatch(ActionCreators.redo())}
            disabled={!canRedo}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {status === "uploading" && (
        <div className="space-y-3">
          <Progress value={progress} className="h-4" />
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
        </div>
      )}

      {status === "error" && (
        <Alert variant="destructive">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription className="space-y-3">
            <p>{message}</p>
            <Button onClick={downloadErrors} size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download Error Report (.csv)
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {totalErrors > 0 && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="font-medium text-orange-900">Fix common issues</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                dispatch(
                  fixAll({
                    field: "priority",
                    value: "MEDIUM",
                    rawRows,
                  })
                )
              }
            >
              Set all priority → MEDIUM
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                dispatch(
                  fixAll({
                    field: "category",
                    value: "TAX",
                    rawRows,
                  })
                )
              }
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
              {table.getHeaderGroups().map((g) => (
                <tr key={g.id}>
                  {g.headers.map((h) => (
                    <th
                      key={h.id}
                      className="px-4 py-3 text-left text-sm font-medium"
                    >
                      {flexRender(
                        h.column.columnDef.header,
                        h.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {virtualizer.getVirtualItems().map((vr) => {
                const row = rows[vr.index];
                if (!row) return null;
                return (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-2 border-t"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!canSubmit || status === "uploading"}
          onClick={handleSubmit}
          className="min-w-80"
        >
          {status === "uploading"
            ? "Importing..."
            : `Submit ${rawRows.length.toLocaleString()} Cases`}
        </Button>
      </div>
    </div>
  );
}
