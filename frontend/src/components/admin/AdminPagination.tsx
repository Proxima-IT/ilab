import { Button } from "@/components/ui/button";

type AdminPaginationProps = {
  page: number;
  lastPage: number;
  total: number;
  label: string;
  loading?: boolean;
  onPageChange: (page: number) => void;
};

export function AdminPagination({
  page,
  lastPage,
  total,
  label,
  loading = false,
  onPageChange,
}: AdminPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-zinc-500">
        Page {page} of {lastPage} · {total} {label}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page <= 1 || loading}
          onClick={() => onPageChange(page - 1)}
          className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={page >= lastPage || loading}
          onClick={() => onPageChange(page + 1)}
          className="border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
