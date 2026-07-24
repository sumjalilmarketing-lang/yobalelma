import { cn } from "@/lib/utils";
import { toUserFacingMessage } from "@/lib/presentation/user-facing-copy";

type FormMessageProps = {
  message?: string;
  tone?: "success" | "error" | "info";
};

export function FormMessage({ message, tone = "info" }: FormMessageProps) {
  if (!message) {
    return null;
  }

  const visibleMessage = tone === "error" ? toUserFacingMessage(message) : message;

  return (
    <p
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-semibold",
        tone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "error" && "border-red-200 bg-red-50 text-red-800",
        tone === "info" && "border-black/10 bg-muted text-muted-foreground",
      )}
    >
      {visibleMessage}
    </p>
  );
}
