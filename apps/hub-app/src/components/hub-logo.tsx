import Image from "next/image";
import Link from "next/link";

export function HubLogo() {
  return (
    <Link className="flex min-w-0 items-center gap-3" href="/hub">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-black shadow-glow">
        <Image alt="Yobalelma" height={40} src="/brand/yobalelma-official-mark.jpeg" width={40} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-black uppercase tracking-[0.22em]">Yobalelma</span>
        <span className="block truncate text-xs font-bold text-muted-foreground">Hub Operations</span>
      </span>
    </Link>
  );
}
