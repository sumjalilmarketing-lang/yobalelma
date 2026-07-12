type SupabaseError = {
  message: string;
};

type RpcResult<T> = {
  data: T | null;
  error: SupabaseError | null;
};

type RpcClient = {
  rpc<T = unknown>(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<RpcResult<T>>;
};

export async function callSupabaseRpc<T = unknown>(
  client: unknown,
  fn: string,
  args?: Record<string, unknown>,
) {
  return await (client as RpcClient).rpc<T>(fn, args);
}
