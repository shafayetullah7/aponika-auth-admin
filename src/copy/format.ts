export const DATE_LOCALE = "en-US";

export function format(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

export function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(DATE_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(DATE_LOCALE, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function paginationLabels(section: {
  paginationShowing: string;
  paginationPrevious: string;
  paginationNext: string;
  paginationPageOf: string;
  paginationPerPage: string;
}) {
  return {
    showing: section.paginationShowing,
    previous: section.paginationPrevious,
    next: section.paginationNext,
    pageOf: (page: number, total: number) =>
      format(section.paginationPageOf, { page, total }),
    perPage: (limit: number) => format(section.paginationPerPage, { limit }),
  };
}
