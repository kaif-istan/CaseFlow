// apps/web/src/store/importSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import undoable from "redux-undo";
import { CaseRowSchema } from "@caseflow/types";
import type { CaseRow } from "@caseflow/types";

export type ColumnMapping = Partial<Record<keyof CaseRow, string>>;

export interface ImportState {
  // Parsing
  rawRows: any[];
  headers: string[];
  totalRows: number;
  parsing: boolean;
  parsedAt: number | null;
  error: string | null;

  // Flow
  columnMapping: ColumnMapping;
  editedRows: Record<number, Partial<Record<keyof CaseRow, string>>>;
  validationErrors: Record<number, Record<keyof CaseRow, string[]>>;
}

const initialState: ImportState = {
  rawRows: [],
  headers: [],
  totalRows: 0,
  parsing: false,
  parsedAt: null,
  error: null,

  columnMapping: {},
  editedRows: {},
  validationErrors: {},
};

// Helper: Build mapped row from raw + edited + mapping
const getMappedRow = (
  rawRow: any,
  edited: Partial<Record<keyof CaseRow, string>>,
  mapping: ColumnMapping
): Partial<CaseRow> => {
  const result: Partial<CaseRow> = {};

  Object.entries(mapping).forEach(([target, source]) => {
    if (!source) return;
    const key = target as keyof CaseRow;
    result[key] = (edited[key] ?? rawRow[source] ?? "") as any;
  });

  return result;
};

// Validate single row
const validateRow = (
  mapped: Partial<CaseRow>
): Record<keyof CaseRow, string[]> => {
  const result = CaseRowSchema.safeParse(mapped);
  if (result.success) return {} as any;

  const errors: Record<keyof CaseRow, string[]> = {} as any;
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof CaseRow;
    if (!errors[field]) errors[field] = [];
    errors[field].push(issue.message);
  });
  return errors;
};

const importSlice = createSlice({
  name: "import",
  initialState,
  reducers: {
    // === Parsing ===
    startParsing: (state) => {
      state.parsing = true;
      state.error = null;
    },

    setParsedData: (
      state,
      action: PayloadAction<{
        data: any[];
        headers: string[];
        totalRows: number;
      }>
    ) => {
      state.rawRows = action.payload.data;
      state.headers = action.payload.headers;
      state.totalRows = action.payload.totalRows;
      state.parsing = false;
      state.parsedAt = Date.now();
      state.error = null;

      // Reset flow on new file
      state.columnMapping = {};
      state.editedRows = {};
      state.validationErrors = {};
    },

    setParseError: (state, action: PayloadAction<string>) => {
      state.parsing = false;
      state.error = action.payload;
    },

    // WARNING:
    // columnMapping keys MUST match CaseRow fields (caseId, applicantName, ...)
    // and values MUST be CSV headers (case_id, applicant_name, ...).
    setColumnMapping: (state, action: PayloadAction<ColumnMapping>) => {
      state.columnMapping = action.payload;
      state.validationErrors = validateAllRows(state);
    },

    updateCell: (
      state,
      action: PayloadAction<{
        rowIndex: number;
        field: keyof CaseRow;
        value: string;
      }>
    ) => {
      const { rowIndex, field, value } = action.payload;

      if (!state.editedRows[rowIndex]) state.editedRows[rowIndex] = {};
      state.editedRows[rowIndex][field] = value;

      const mapped = getMappedRow(
        state.rawRows[rowIndex],
        state.editedRows[rowIndex],
        state.columnMapping
      );
      const errors = validateRow(mapped);

      if (Object.keys(errors).length > 0) {
        state.validationErrors[rowIndex] = errors;
      } else {
        delete state.validationErrors[rowIndex];
      }
    },

    fixAll: (
      state,
      action: PayloadAction<{ field: keyof CaseRow; value: string }>
    ) => {
      const { field, value } = action.payload;

      state.rawRows.forEach((_, i) => {
        if (!state.editedRows[i]) state.editedRows[i] = {};
        state.editedRows[i][field] = value;
      });

      state.validationErrors = validateAllRows(state);
    },

    resetImport: () => initialState,
  },
});

// === Validation Helpers ===
function validateAllRows(
  state: ImportState
): Record<number, Record<keyof CaseRow, string[]>> {
  const errors: Record<number, Record<keyof CaseRow, string[]>> = {};

  state.rawRows.forEach((rawRow, i) => {
    const edited = state.editedRows[i] || {};
    const mapped = getMappedRow(rawRow, edited, state.columnMapping);
    const rowErrors = validateRow(mapped);
    if (Object.keys(rowErrors).length > 0) {
      errors[i] = rowErrors;
    }
  });

  return errors;
}

// === Undo/Redo (only edits, not parsing/mapping) ===
export const undoableImport = undoable(importSlice.reducer, {
  limit: 100,
  filter: (action) =>
    ![
      "import/startParsing",
      "import/setParsedData",
      "import/setParseError",
      "import/setColumnMapping",
      "import/resetImport",
    ].includes(action.type),
});

export const {
  startParsing,
  setParsedData,
  setParseError,
  setColumnMapping,
  updateCell,
  fixAll,
  resetImport,
} = importSlice.actions;

export default undoableImport;
