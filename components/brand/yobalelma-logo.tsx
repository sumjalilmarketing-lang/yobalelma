import Image from "next/image";
import { cn } from "@/lib/utils";

type YobalelmaLogoProps = {
  className?: string;
  compact?: boolean;
  variant?: "mark" | "wordmark" | "lockup" | "official" | "light";
};

const logoAssets = {
  light: {
    src: "/brand/yobalelma-official-wordmark.jpeg",
    width: 1210,
    height: 230,
    className: "h-10 w-[210px] p-1.5 sm:h-11 sm:w-[232px]",
  },
  official: {
    src: "/brand/yobalelma-official.jpeg",
    width: 1280,
    height: 1280,
    className: "h-14 w-14 p-1",
  },
  mark: {
    src: "/brand/yobalelma-official-mark.jpeg",
    width: 740,
    height: 390,
    className: "h-10 w-[76px] p-1",
  },
  wordmark: {
    src: "/brand/yobalelma-official-wordmark.jpeg",
    width: 1210,
    height: 230,
    className: "h-10 w-[210px] p-1.5 sm:h-11 sm:w-[232px]",
  },
  lockup: {
    src: "/brand/yobalelma-official-lockup.jpeg",
    width: 1210,
    height: 650,
    className: "h-28 w-[220px] p-1.5 sm:h-32 sm:w-[250px]",
  },
};

export function YobalelmaLogo({
  className,
  compact = false,
  variant,
}: YobalelmaLogoProps) {
  const logo = logoAssets[variant ?? (compact ? "mark" : "wordmark")];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center overflow-hidden rounded-md bg-black shadow-line",
        logo.className,
        className,
      )}
      role="img"
      aria-label="Yobalelma"
    >
      <Image
        src={logo.src}
        alt=""
        width={logo.width}
        height={logo.height}
        priority
        className="h-full w-full object-contain"
      />
    </span>
  );
}
