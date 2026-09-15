import { configureStore } from '@reduxjs/toolkit'

/** No slices yet — add them to `reducer` as contexts get migrated. */
export const store = configureStore({
  reducer: {},
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
