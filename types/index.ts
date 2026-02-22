// types/index.ts
// Central type definitions shared across the entire app.

export interface Participant {
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  total?: number;
}

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  expenseId: string;
}

export interface Expense {
  id: string;
  projectId: string;
  payerId: string;
  payer: { id: string; name: string };
  date: string;
  note?: string | null;
  total: number;
  items: ExpenseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  currency: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  participants: Participant[];
  expenses?: Expense[];
  totalSpent?: number;
  grandTotal?: number;
  participantTotals?: Participant[];
  dailyTotals?: { date: string; total: number }[];
  _count?: { expenses: number };
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ExpensesResponse {
  expenses: Expense[];
  pagination: PaginationMeta;
}
