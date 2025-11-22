// apps/web/src/store/store.ts
import { configureStore } from "@reduxjs/toolkit"
import importReducer from "./importSlice"
// ... other reducers later

export const store = configureStore({
  reducer: {
    import: importReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
