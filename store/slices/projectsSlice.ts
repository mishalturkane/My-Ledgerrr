// store/slices/projectsSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { Project } from "@/types";

interface ProjectsState {
  items: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProjectsState = {
  items: [],
  currentProject: null,
  loading: false,
  error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProjects = createAsyncThunk<
  Project[],
  void,
  { rejectValue: string }
>("projects/fetchAll", async (_, { rejectWithValue }) => {
  const res = await fetch("/api/projects");
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to fetch projects");
  }
  return res.json();
});

export const fetchProject = createAsyncThunk<
  Project,
  string,
  { rejectValue: string }
>("projects/fetchOne", async (id, { rejectWithValue }) => {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to fetch project");
  }
  return res.json();
});

export const createProject = createAsyncThunk<
  Project,
  { name: string; description?: string; currency: string; participants: string[] },
  { rejectValue: string }
>("projects/create", async (data, { rejectWithValue }) => {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to create project");
  }
  return res.json();
});

export const deleteProject = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("projects/delete", async (id, { rejectWithValue }) => {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return rejectWithValue(err.error ?? "Failed to delete project");
  }
  return id;
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearCurrentProject(state) {
      state.currentProject = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchProjects
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    // fetchProject
    builder
      .addCase(fetchProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProject.fulfilled, (state, action) => {
        state.loading = false;
        state.currentProject = action.payload;
      })
      .addCase(fetchProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    // createProject
    builder
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unknown error";
      });

    // deleteProject
    builder.addCase(deleteProject.fulfilled, (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      if (state.currentProject?.id === action.payload) {
        state.currentProject = null;
      }
    });
  },
});

export const { clearCurrentProject, clearError } = projectsSlice.actions;
export default projectsSlice.reducer;
