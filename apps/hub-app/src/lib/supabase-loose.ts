type SupabaseError = {
  message: string;
};

type PostgrestResult<T> = PromiseLike<{
  data: T | null;
  error: SupabaseError | null;
}>;

type LooseSelectQuery<T> = PostgrestResult<T[]> & {
  eq(column: string, value: unknown): LooseSelectQuery<T>;
  limit(count: number): LooseSelectQuery<T>;
  order(column: string, options?: { ascending?: boolean }): LooseSelectQuery<T>;
  maybeSingle(): PostgrestResult<T>;
  single(): PostgrestResult<T>;
};

type LooseUpdateQuery = PostgrestResult<null> & {
  eq(column: string, value: unknown): LooseUpdateQuery;
  select<T = Record<string, unknown>>(columns: string): LooseSelectQuery<T>;
};

type LooseInsertQuery<T> = {
  select(columns: string): {
    single(): PostgrestResult<T>;
  };
};

type LooseTable = {
  insert<T = Record<string, unknown>>(values: Record<string, unknown>): LooseInsertQuery<T>;
  select<T = Record<string, unknown>>(columns: string): LooseSelectQuery<T>;
  update(values: Record<string, unknown>): LooseUpdateQuery;
};

type LooseSupabaseClient = {
  from(table: string): LooseTable;
  rpc<T = Record<string, unknown>[]>(name: string, params?: Record<string, unknown>): PostgrestResult<T>;
};

export function fromSupabaseTable(client: unknown, table: string) {
  return (client as LooseSupabaseClient).from(table);
}

export function callSupabaseRpc<T = Record<string, unknown>[]>(client: unknown, name: string, params?: Record<string, unknown>) {
  return (client as LooseSupabaseClient).rpc<T>(name, params);
}
