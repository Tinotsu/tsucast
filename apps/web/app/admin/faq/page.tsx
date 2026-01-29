"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAdminFAQ,
  createFAQItem,
  updateFAQItem,
  deleteFAQItem,
  reorderFAQ,
  type FAQItem,
} from "@/lib/admin-api";
import {
  HelpCircle,
  Loader2,
  Trash2,
  Plus,
  Pencil,
  GripVertical,
  Eye,
  EyeOff,
  Save,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminFAQPage() {
  const [items, setItems] = useState<FAQItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [published, setPublished] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Drag state
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      const data = await getAdminFAQ();
      setItems(data.items.sort((a, b) => a.position - b.position));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load FAQ items");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadItems();
      setIsLoading(false);
    };
    init();
  }, [loadItems]);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setPublished(true);
    setEditingId(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleEdit = (item: FAQItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setPublished(item.published);
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (editingId) {
        // Update existing
        const result = await updateFAQItem(editingId, {
          question,
          answer,
          published,
        });
        setItems((prev) =>
          prev.map((item) => (item.id === editingId ? result.item : item))
        );
      } else {
        // Create new
        const position = items.length > 0 ? Math.max(...items.map((i) => i.position)) + 1 : 0;
        const result = await createFAQItem({
          question,
          answer,
          position,
          published,
        });
        setItems((prev) => [...prev, result.item].sort((a, b) => a.position - b.position));
      }
      resetForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save FAQ item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ item?")) return;

    try {
      await deleteFAQItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  };

  const handleTogglePublished = async (item: FAQItem) => {
    const newPublished = !item.published;

    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, published: newPublished } : i))
    );

    try {
      await updateFAQItem(item.id, { published: newPublished });
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, published: !newPublished } : i))
      );
      setError(err instanceof Error ? err.message : "Failed to update");
    }
  };

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex((i) => i.id === draggedId);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    // Update positions
    const reordered = newItems.map((item, index) => ({
      ...item,
      position: index,
    }));

    setItems(reordered);
  };

  const handleDragEnd = async () => {
    if (!draggedId) return;

    try {
      await reorderFAQ(items.map((item) => ({ id: item.id, position: item.position })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder");
      await loadItems(); // Reload on error
    }

    setDraggedId(null);
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1a1a1a]">
            FAQ Management
          </h1>
          <p className="mt-2 font-normal leading-relaxed text-[#737373]">
            Manage frequently asked questions displayed on the landing page
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#333]"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Question
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500 p-4 text-white">
          {error}
          <button onClick={() => setError(null)} className="ml-4 underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="mb-8 rounded-2xl border border-[#e5e5e5] bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-[#1a1a1a]">
            {editingId ? "Edit Question" : "Add Question"}
          </h2>

          {formError && (
            <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Question */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                Question <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g., What links work with tsucast?"
                required
                className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>

            {/* Answer */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[#1a1a1a]">
                Answer <span className="text-red-500">*</span>
              </label>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write the answer here..."
                rows={4}
                required
                className="w-full rounded-lg border border-[#e5e5e5] bg-white px-3 py-2 text-sm text-[#1a1a1a] focus:border-[#1a1a1a] focus:outline-none"
              />
            </div>

            {/* Published */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 rounded border-[#e5e5e5]"
              />
              <label htmlFor="published" className="text-sm text-[#1a1a1a]">
                Published (visible on landing page)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[#1a1a1a] px-4 py-2 text-sm font-bold text-white hover:bg-[#333] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingId ? "Update" : "Save"}
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#e5e5e5] px-4 py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#f5f5f5]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FAQ List */}
      <div className="rounded-2xl border border-[#e5e5e5] bg-white">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <HelpCircle className="mb-4 h-12 w-12 text-[#737373]" />
            <p className="font-normal text-[#737373]">No FAQ items yet</p>
            <p className="mt-1 text-sm text-[#999]">
              Click &quot;Add Question&quot; to create your first FAQ
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#e5e5e5]">
            {/* Table Header */}
            <div className="grid grid-cols-[40px_1fr_80px_80px] gap-4 px-4 py-3 text-xs font-medium text-[#737373]">
              <span></span>
              <span>Question / Answer</span>
              <span>Status</span>
              <span>Actions</span>
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "grid grid-cols-[40px_1fr_80px_80px] items-start gap-4 px-4 py-4 text-sm",
                  draggedId === item.id && "opacity-50 bg-[#f5f5f5]"
                )}
              >
                {/* Drag Handle */}
                <div className="flex cursor-grab items-center justify-center pt-1 text-[#737373] hover:text-[#1a1a1a]">
                  <GripVertical className="h-4 w-4" />
                </div>

                {/* Question & Answer */}
                <div className="min-w-0">
                  <p className="font-medium text-[#1a1a1a]">{item.question}</p>
                  <p className="mt-1 text-sm text-[#737373] line-clamp-2">
                    {item.answer}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <button
                    onClick={() => handleTogglePublished(item)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold",
                      item.published
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                    title={item.published ? "Click to unpublish" : "Click to publish"}
                  >
                    {item.published ? (
                      <>
                        <Eye className="h-3 w-3" />
                        Live
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(item)}
                    className="rounded p-1.5 text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="rounded p-1.5 text-[#737373] hover:bg-red-50 hover:text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-[#737373]">
        Drag items to reorder. Published items appear on the landing page.
      </p>
    </div>
  );
}
