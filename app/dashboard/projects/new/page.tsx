"use client";
// app/dashboard/projects/new/page.tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateProjectFormSchema, type CreateProjectFormInput } from "@/lib/validations";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createProject } from "@/store/slices/projectsSlice";
import { addToast } from "@/store/slices/uiSlice";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2 } from "lucide-react";

export default function NewProjectPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const loading = useAppSelector((s) => s.projects.loading);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CreateProjectFormInput>({
    resolver: zodResolver(CreateProjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      currency: "INR",
      participants: [{ value: "" }, { value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "participants",
  });

  const onSubmit = async (data: CreateProjectFormInput) => {
    const cleaned = {
      ...data,
      participants: data.participants
        .map((p) => p.value.trim())
        .filter((p) => p.length > 0),
    };

    if (cleaned.participants.length === 0) {
      dispatch(addToast({ message: "Add at least one participant", type: "error" }));
      return;
    }

    const result = await dispatch(createProject(cleaned));

    if (createProject.fulfilled.match(result)) {
      dispatch(addToast({ message: "Project created!", type: "success" }));
      router.push(`/dashboard/projects/${result.payload.id}`);
    } else {
      dispatch(
        addToast({
          message: (result.payload as string) ?? "Failed to create project",
          type: "error",
        })
      );
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-slide-up">
      <Link
        href="/dashboard/projects"
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Projects
      </Link>

      <div className="card p-8">
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-2">
          New Ledger Project
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Set up a project to start tracking shared expenses
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label className="label">Project Name *</label>
            <input
              {...register("name")}
              className="input"
              placeholder="e.g. Goa Trip 2025, Daily Room Spend"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              {...register("description")}
              className="input resize-none"
              rows={2}
              placeholder="What is this project for?"
            />
            {errors.description && (
              <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="label">Currency</label>
            <select {...register("currency")} className="input">
              <option value="INR">₹ INR – Indian Rupee</option>
              <option value="USD">$ USD – US Dollar</option>
              <option value="EUR">€ EUR – Euro</option>
              <option value="GBP">£ GBP – British Pound</option>
              <option value="AED">د.إ AED – UAE Dirham</option>
              <option value="SGD">S$ SGD – Singapore Dollar</option>
            </select>
          </div>

          {/* Participants */}
          <div>
            <label className="label">Participants *</label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Add the names of everyone sharing expenses in this project
            </p>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <input
                  //@
                    {...register(`participants.${index}.value`)}
                    className="input"
                    placeholder={`Participant ${index + 1} (e.g. Rahul)`}
                  />
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                      aria-label="Remove participant"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {fields.length < 20 && (
              <button
                type="button"
                onClick={() => append({ value: "" })}
                className="btn-ghost text-sm mt-2"
              >
                <Plus size={16} /> Add Participant
              </button>
            )}
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Creating…
              </>
            ) : (
              "Create Project"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}