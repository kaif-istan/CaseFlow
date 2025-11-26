// apps/web/src/store/importEditSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CaseRow } from "@caseflow/types";
import { CaseRowSchema } from "@caseflow/types";
import { setParsedData, resetImport } from "./importSlice";

export interface ImportEditState {
  editedRows: Record<number, Partial<Record<keyof CaseRow, string>>>;
  validationErrors: Record<number, Partial<Record<keyof CaseRow, string[]>>>;
}

const initialEditState: ImportEditState = {
  editedRows: {},
  validationErrors: {},
};

// Validate a single row into field → errors[]
const validateRow = (
  mapped: Partial<CaseRow>
): Partial<Record<keyof CaseRow, string[]>> => {
  const result = CaseRowSchema.safeParse(mapped);
  if (result.success) return {};

  const errors: Partial<Record<keyof CaseRow, string[]>> = {};
  result.error.issues.forEach((issue) => {
    const field = issue.path[0] as keyof CaseRow;
    if (!errors[field]) errors[field] = [];
    errors[field]!.push(issue.message);
  });
  return errors;
};

function validateAllRows(
  rawRows: any[],
  editedRows: Record<number, Partial<Record<keyof CaseRow, string>>>
): Record<number, Partial<Record<keyof CaseRow, string[]>>> {
  const errors: Record<number, Partial<Record<keyof CaseRow, string[]>>> = {};

  rawRows.forEach((rawRow, i) => {
    const edited = editedRows[i] || {};
    const fullRow: Partial<CaseRow> = {
      ...(rawRow as CaseRow),
      ...(edited as Partial<CaseRow>),
    };

    const rowErrors = validateRow(fullRow);
    if (Object.keys(rowErrors).length > 0) {
      errors[i] = rowErrors;
    }
  });

  return errors;
}

const importEditSlice = createSlice({
  name: "importEdits",
  initialState: initialEditState,
  reducers: {
    updateCell: (
      state,
      action: PayloadAction<{
        rowIndex: number;
        field: keyof CaseRow;
        value: string;
        rawRow: any; // normalized CaseRow-ish from csvWorker
      }>
    ) => {
      const { rowIndex, field, value, rawRow } = action.payload;

      if (!state.editedRows[rowIndex]) state.editedRows[rowIndex] = {};
      state.editedRows[rowIndex][field] = value;

      // Build full row = raw + edits and validate
      const fullRow: Partial<CaseRow> = {
        ...(rawRow as CaseRow),
        ...(state.editedRows[rowIndex] as Partial<CaseRow>),
      };

      const errors = validateRow(fullRow);

      if (Object.keys(errors).length > 0) {
        state.validationErrors[rowIndex] = errors;
      } else {
        delete state.validationErrors[rowIndex];
      }
    },

    fixAll: (
      state,
      action: PayloadAction<{
        field: keyof CaseRow;
        value: string;
        rawRows: any[]; // full raw rows array
      }>
    ) => {
      const { field, value, rawRows } = action.payload;

      rawRows.forEach((_, i) => {
        if (!state.editedRows[i]) state.editedRows[i] = {};
        state.editedRows[i][field] = value;
      });

      state.validationErrors = validateAllRows(rawRows, state.editedRows);
    },

    revalidateAll: (state, action: PayloadAction<any[]>) => {
      const rawRows = action.payload;
      state.validationErrors = validateAllRows(rawRows, state.editedRows);
    },

    resetEdits: () => initialEditState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(setParsedData, (state, action) => {
        // Reset edits on new file
        state.editedRows = {};
        // Do NOT validate yet. Wait for mapping.
        state.validationErrors = {};
        return state;
      })
      .addCase(resetImport, () => initialEditState);
  },
});

export const { updateCell, fixAll, revalidateAll, resetEdits } =
  importEditSlice.actions;
export default importEditSlice.reducer;
