// store/slices/expensesSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Expense, ExpensesResponse, PaginationMeta } from "@/types";

interface ExpenseFilters {
  search: string;
  payerId: string;
  startDate: string;
  endDate: string;
}

interface ExpensesState {
  items: Expense[];
  loading: boolean;
  error: string | null;
  pagination: PaginationMeta;
  filters: ExpenseFilters;
}

const initialState: ExpensesState = {
  items: [],
  loading: false,
  error: null,
  pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
  filters: { search: "", payerId: "", startDate: "", endDate: "" },
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchExpenses = createAsyncThunk<
  ExpensesResponse,
  {
    projectId: string;
    page?: number;
    search?: string;
    payerId?: string;
    startDate?: string;
    endDate?: string;
  },
  { rejectValue: string }
>("expenses/fetchAll", async (params, { rejectWithValue }) => {
  const sp = new URLSearchParams({ projectId: params.projectId });
  if (params.page) sp.set("page", String(params.page));
  if (params.search) sp.set("search", params.search);
  if (params.payerId) sp.set("payerId", params.payerId);
  if (params.startDate) sp.set("startDate", params.startDate);
  if (params.endDate) sp.set("endDate", params.endDate);

  const res = await fetch(`/api/expenses?${sp.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to fetch expenses");
  }
  return res.json();
});

export const createExpense = createAsyncThunk<
  Expense,
  {
    projectId: string;
    payerId: string;
    date: string;
    note?: string;
    items: { name: string; price: number; quantity: number }[];
  },
  { rejectValue: string }
>("expenses/create", async (data, { rejectWithValue }) => {
  const res = await fetch("/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to create expense");
  }
  return res.json();
});

export const deleteExpense = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("expenses/delete", async (id, { rejectWithValue }) => {
  const res = await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to delete expense");
  }
  return id;
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearExpenses(state) {
      state.items = [];
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.expenses;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    builder
      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    builder.addCase(deleteExpense.fulfilled, (state, action) => {
      state.items = state.items.filter((e) => e.id !== action.payload);
      state.pagination.total = Math.max(0, state.pagination.total - 1);
    });
  },
});

export const { setFilters, clearExpenses } = expensesSlice.actions;
export default expensesSlice.reducer;
