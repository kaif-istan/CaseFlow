// apps/web/src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { undoableImport } from "./importSlice";

export const store = configureStore({
  reducer: {
    import: undoableImport,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
