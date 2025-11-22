// apps/web/src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import importReducer from "./importSlice"; // ← your original (untouched)
import importFlowReducer from "./importFlowSlice"; // ← new Phase 4+

export const store = configureStore({
  reducer: {
    import: importReducer, // Phase 3: CSV upload + preview
    importFlow: importFlowReducer, // Phase 4+: mapping + edits + undo
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
