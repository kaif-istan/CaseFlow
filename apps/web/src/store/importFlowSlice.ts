// apps/web/src/store/importFlowSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import undoable from "redux-undo"
import { z } from "zod"
import { CaseRowSchema } from "@caseflow/db"

export type CaseRow = z.infer<typeof CaseRowSchema>
export type ColumnMapping = Partial<Record<keyof CaseRow, string>> // target field → CSV header

interface ImportFlowState {
  columnMapping: ColumnMapping
  editedRows: Record<number, Partial<Record<keyof CaseRow, string>>> // rowIndex → { field: value }
  validationErrors: Record<number, Record<keyof CaseRow, string[]>>
}

const initialState: ImportFlowState = {
  columnMapping: {},
  editedRows: {},
  validationErrors: {},
}

const importFlowSlice = createSlice({
  name: "importFlow",
  initialState,
  reducers: {
    setColumnMapping: (state, action: PayloadAction<ColumnMapping>) => {
      state.columnMapping = action.payload
      state.validationErrors = {} // reset on remap
    },

    updateCell: (
      state,
      action: PayloadAction<{
        rowIndex: number
        field: keyof CaseRow
        value: string
      }>
    ) => {
      const { rowIndex, field, value } = action.payload

      // Ensure the row object exists
      if (!state.editedRows[rowIndex]) {
        state.editedRows[rowIndex] = {}
      }

      // Now safe: we're writing string to string
      state.editedRows[rowIndex][field] = value

      // Optional: clear error for this field immediately
      if (state.validationErrors[rowIndex]?.[field]) {
        delete state.validationErrors[rowIndex][field]
        if (Object.keys(state.validationErrors[rowIndex]).length === 0) {
          delete state.validationErrors[rowIndex]
        }
      }
    },

    fixAll: (
      state,
      action: PayloadAction<{ field: keyof CaseRow; value: string }>
    ) => {
      const { field, value } = action.payload
      Object.keys(state.editedRows).forEach((idx) => {
        const index = Number(idx)
        if (!state.editedRows[index]) state.editedRows[index] = {}
        state.editedRows[index][field] = value
      })
    },

    resetFlow: () => initialState,
  },
})

// Full undo/redo on all edits (except mapping & reset)
export const undoableImportFlow = undoable(importFlowSlice.reducer, {
  limit: 100,
  filter: (action) =>
    !["importFlow/setColumnMapping", "importFlow/resetFlow"].includes(action.type),
})

export const { setColumnMapping, updateCell, fixAll, resetFlow } =
  importFlowSlice.actions

export default undoableImportFlow