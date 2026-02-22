"use client";
// app/dashboard/projects/[id]/expenses/new/page.tsx
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, X, Loader2, Calculator } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { createExpense } from "@/store/slices/expensesSlice";
import { fetchProject } from "@/store/slices/projectsSlice";
import { addToast } from "@/store/slices/uiSlice";
import { formatCurrency } from "@/lib/utils";
import { z } from "zod";

// Local form schema (slightly looser than server schema — coerces types)
const FormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  payerId: z.string().min(1, "Select a payer"),
  note: z.string().max(200).optional(),
  items: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        price: z
          .number({ invalid_type_error: "Enter a valid price" })
          .positive("Price must be positive"),
        quantity: z.number().int().min(1).default(1),
      })
    )
    .min(1, "Add at least one item"),
});

type FormValues = z.infer<typeof FormSchema>;

export default function NewExpensePage() {
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const dispatch = useAppDispatch();

  const project = useAppSelector((s) => s.projects.currentProject);
  const loading = useAppSelector((s) => s.expenses.loading);

  // Load project data for participant list
  useEffect(() => {
    dispatch(fetchProject(projectId));
  }, [dispatch, projectId]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      payerId: "",
      note: "",
      items: [{ name: "", price: 0, quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Live total calculation
  const watchedItems = watch("items");
  const total = watchedItems.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const onSubmit = async (data: FormValues) => {
    const result = await dispatch(
      createExpense({
        projectId,
        payerId: data.payerId,
        date: new Date(data.date).toISOString(),
        note: data.note || undefined,
        items: data.items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
      })
    );

    if (createExpense.fulfilled.match(result)) {
      dispatch(addToast({ message: "Expense added!", type: "success" }));
      router.push(`/dashboard/projects/${projectId}`);
    } else {
      dispatch(
        addToast({
          message: (result.payload as string) ?? "Failed to add expense",
          type: "error",
        })
      );
    }
  };

  return (
    <div className="max-w-xl mx-auto animate-slide-up">
      <Link
        href={`/dashboard/projects/${projectId}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to {project?.name ?? "Project"}
      </Link>

      <div className="card p-8">
        <h1 className="font-display font-bold text-2xl text-slate-800 dark:text-white mb-1">
          Add Expense
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Record a new expense entry for this project
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Date + Payer */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date *</label>
              <input {...register("date")} type="date" className="input" />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="label">Paid By *</label>
              <select {...register("payerId")} className="input">
                <option value="">Select payer</option>
                {project?.participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {errors.payerId && (
                <p className="text-red-500 text-xs mt-1">{errors.payerId.message}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note (optional)</label>
            <input
              {...register("note")}
              className="input"
              placeholder="e.g. Grocery run for the week"
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Items *</label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {fields.length} item{fields.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid grid-cols-[1fr,auto,auto,auto] gap-2 items-start"
                >
                  {/* Name */}
                  <div>
                    <input
                      {...register(`items.${index}.name`)}
                      className="input"
                      placeholder="Item name"
                    />
                    {errors.items?.[index]?.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.items[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <input
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    type="number"
                    min="1"
                    className="input w-16 text-center"
                    placeholder="Qty"
                  />

                  {/* Price */}
                  <div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        ₹
                      </span>
                      <input
                        {...register(`items.${index}.price`, { valueAsNumber: true })}
                        type="number"
                        min="0"
                        step="0.01"
                        className="input pl-7 w-28"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.items?.[index]?.price && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.items[index]?.price?.message}
                      </p>
                    )}
                  </div>

                  {/* Remove */}
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors mt-0.5"
                      aria-label="Remove item"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => append({ name: "", price: 0, quantity: 1 })}
              className="btn-ghost text-sm mt-2"
            >
              <Plus size={16} /> Add Item
            </button>
          </div>

          {/* Live total */}
          <div className="flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/20 rounded-2xl border border-brand-100 dark:border-brand-800">
            <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
              <Calculator size={18} />
              <span className="font-medium text-sm">Calculated Total</span>
            </div>
            <span className="font-mono font-bold text-xl text-brand-700 dark:text-brand-300">
              {formatCurrency(total, project?.currency ?? "INR")}
            </span>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving…
              </>
            ) : (
              "Save Expense"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
