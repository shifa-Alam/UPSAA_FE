import { HttpParams, HttpResponse } from '@angular/common/http';

/**
 * One page of a content list (notices, events, gallery…). The API returns the rows as a
 * plain array and the full match count in the X-Total-Count header (see the backend's
 * ListPaging), so a page of 4 notices still knows there are 37 in total.
 */
export interface ListPage<T> {
  items: T[];
  total: number;
}

/** skip/take plus any endpoint-specific filters; empty values are left out. */
export type ListQuery = Record<string, string | number | boolean | null | undefined>;

export function listParams(query: ListQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}

export function toListPage<T>(res: HttpResponse<T[]>): ListPage<T> {
  const items = res.body ?? [];
  const header = res.headers.get('X-Total-Count');
  return { items, total: header !== null && !isNaN(+header) ? +header : items.length };
}
