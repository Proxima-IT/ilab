import ilabLogo from "@/assets/iLab_logo.png";
import { cn } from "@/lib/utils";

const sizes = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-14 w-14",
  "2xl": "h-16 w-16",
} as const;

type SiteLogoProps = {
  size?: keyof typeof sizes;
  className?: string;
  imgClassName?: string;
  /** Show the "iLab" wordmark beside the logo image */
  showWordmark?: boolean;
  wordmarkClassName?: string;
};

export function SiteLogo({
  size = "sm",
  className,
  imgClassName,
  showWordmark = false,
  wordmarkClassName,
}: SiteLogoProps) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <img
        src={ilabLogo}
        alt="iLab BD"
        className={cn(sizes[size], "shrink-0 rounded-full object-cover", imgClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            "truncate text-xl font-bold tracking-tight text-foreground",
            wordmarkClassName,
          )}
        >
          iLab
        </span>
      )}
    </span>
  );
}
