// apps/web/src/store/importSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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

  // Flow (non-undoable)
  columnMapping: ColumnMapping;
  mappingCompleted: boolean;
}

const initialState: ImportState = {
  rawRows: [],
  headers: [],
  totalRows: 0,
  parsing: false,
  parsedAt: null,
  error: null,
  columnMapping: {},
  mappingCompleted: false,
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

      // Reset mapping on new file
      state.columnMapping = {};
      state.mappingCompleted = false;
    },

    setParseError: (state, action: PayloadAction<string>) => {
      state.parsing = false;
      state.error = action.payload;
    },

    setColumnMapping: (state, action: PayloadAction<ColumnMapping>) => {
      state.columnMapping = action.payload;
    },

    setMappingCompleted: (state, action: PayloadAction<boolean>) => {
      state.mappingCompleted = action.payload;
    },

    applyMapping: (state) => {
      // Transform rawRows based on columnMapping
      // This ensures that subsequent components can rely on standard keys
      const mapping = state.columnMapping;

      state.rawRows = state.rawRows.map((row) => {
        const newRow: any = { ...row };

        // Map mapped fields to their canonical keys
        Object.entries(mapping).forEach(([field, header]) => {
          if (header && row[header] !== undefined) {
            newRow[field] = row[header];
          }
        });

        return newRow;
      });
    },

    resetImport: () => initialState,
  },
});

export const {
  startParsing,
  setParsedData,
  setParseError,
  setColumnMapping,
  setMappingCompleted,
  applyMapping,
  resetImport,
} = importSlice.actions;

export default importSlice.reducer;
