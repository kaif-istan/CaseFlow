// apps/web/src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import importReducer from "./importSlice";
import importEditReducer from "./importEditSlice";
import undoable from "redux-undo";

const undoableEdits = undoable(importEditReducer, {
  limit: 100,
  // we only care about edits history; no custom filter needed
});

export const store = configureStore({
  reducer: {
    import: importReducer,      // core, non-undoable
    importEdits: undoableEdits, // undoable edits
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
