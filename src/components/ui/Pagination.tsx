import Button from "./Button";
import type { PaginationMeta } from "~/lib/api/types";

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
  limitOptions?: number[];
  labels: {
    showing: string;
    previous: string;
    next: string;
    pageOf: (page: number, totalPages: number) => string;
    perPage: (limit: number) => string;
  };
}

export function Pagination(props: PaginationProps) {
  const {
    meta,
    onPageChange,
    onLimitChange,
    showLimitSelector = false,
    limitOptions = [10, 20, 50],
    labels,
  } = props;

  if (!meta || meta.totalPages <= 1) {
    return null;
  }

  const startIndex = (meta.page - 1) * meta.limit + 1;
  const endIndex = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div class="flex flex-col items-center justify-between gap-4 border-t border-cream-200 bg-white px-6 py-4 sm:flex-row">
      <div class="text-sm text-forest-700">
        {labels.showing
          .replace("{start}", String(startIndex))
          .replace("{end}", String(endIndex))
          .replace("{total}", String(meta.total))}
      </div>

      <div class="flex items-center gap-4">
        {showLimitSelector && onLimitChange && (
          <select
            class="focus-ring-flat h-9 rounded-lg border-2 border-cream-200 bg-white px-3 py-1 text-sm text-forest-700"
            value={meta.limit}
            onChange={(event) => onLimitChange(Number(event.currentTarget.value))}
            aria-label="Results per page"
          >
            {limitOptions.map((limit) => (
              <option value={limit}>{labels.perPage(limit)}</option>
            ))}
          </select>
        )}

        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasPrevious}
            onClick={() => onPageChange(meta.page - 1)}
          >
            {labels.previous}
          </Button>

          <span class="flex items-center px-3 text-sm font-medium text-forest-700">
            {labels.pageOf(meta.page, meta.totalPages)}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={!meta.hasNext}
            onClick={() => onPageChange(meta.page + 1)}
          >
            {labels.next}
          </Button>
        </div>
      </div>
    </div>
  );
}
