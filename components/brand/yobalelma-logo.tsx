import Image from "next/image";
import { cn } from "@/lib/utils";

type YobalelmaLogoProps = {
  className?: string;
  compact?: boolean;
};

export function YobalelmaLogo({ className, compact = false }: YobalelmaLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-3", className)} aria-label="Yobalelma">
      <Image
        src="/brand/yobalelma-mark.svg"
        alt=""
        width={42}
        height={42}
        priority
        className="h-10 w-10"
      />
      {!compact ? (
        <span className="text-xl font-black tracking-normal">Yobalelma</span>
      ) : null}
    </div>
  );
}

