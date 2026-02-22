// store/index.ts
import { configureStore } from "@reduxjs/toolkit";
import projectsReducer from "@/store/slices/projectsSlice";
import expensesReducer from "@/store/slices/expensesSlice";
import uiReducer from "@/store/slices/uiSlice";

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    expenses: expensesReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
