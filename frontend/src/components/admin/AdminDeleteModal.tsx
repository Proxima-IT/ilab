import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type AdminDeleteModalProps = {
  open: boolean;
  title: string;
  description: string;
  itemName?: string;
  loading?: boolean;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function AdminDeleteModal({
  open,
  title,
  description,
  itemName,
  loading = false,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: AdminDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 px-4 py-8 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close delete confirmation"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/50">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-primary" />

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-white disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="flex gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-rose-500/25 bg-rose-500/10 text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h2 className="pr-8 text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>

              {itemName && (
                <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/70 px-3 py-2">
                  <p className="text-[11px] uppercase tracking-wide text-zinc-500">Selected item</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-zinc-100">{itemName}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
