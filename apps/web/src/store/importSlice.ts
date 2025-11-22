import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// apps/web/src/store/importSlice.ts
interface ImportState {
  rawRows: any[];
  headers: string[];
  totalRows: number;
  parsing: boolean;
  parsedAt: number | null;
  error: string | null;
}

const initialState: ImportState = {
  rawRows: [],
  headers: [],
  totalRows: 0,
  parsing: false,
  parsedAt: null,
  error: null,
};

export const importSlice = createSlice({
  name: "import",
  initialState,
  reducers: {
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
    },
    setParseError: (state, action: PayloadAction<string>) => {
      state.parsing = false;
      state.error = action.payload;
    },
    resetImport: () => initialState,
  },
});

export const { startParsing, setParsedData, setParseError, resetImport } =
  importSlice.actions;
export default importSlice.reducer;
