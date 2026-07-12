type SupabaseError = {
  message: string;
};

type QueryResult<T> = {
  data: T[] | null;
  error: SupabaseError | null;
};

type SingleQueryResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};

type LooseQueryBuilder<T> = PromiseLike<QueryResult<T>> & {
  eq(column: string, value: unknown): LooseQueryBuilder<T>;
  limit(count: number): LooseQueryBuilder<T>;
  maybeSingle(): PromiseLike<SingleQueryResult<T>>;
  order(column: string, options?: { ascending?: boolean }): LooseQueryBuilder<T>;
  single(): PromiseLike<SingleQueryResult<T>>;
};

type LooseTableBuilder<T> = {
  select(columns?: string): LooseQueryBuilder<T>;
};

type LooseSupabaseClient = {
  from<T = Record<string, unknown>>(table: string): LooseTableBuilder<T>;
};

export function selectFromLooseTable<T = Record<string, unknown>>(
  client: unknown,
  table: string,
  columns?: string,
) {
  return (client as LooseSupabaseClient).from<T>(table).select(columns);
}
