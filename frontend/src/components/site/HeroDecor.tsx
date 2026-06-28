import { Smartphone, Wrench, Cog, Cpu, BatteryCharging, Zap, Hammer, CircuitBoard } from "lucide-react";

/**
 * Decorative floating mobile-repair icons + soft blobs for page hero backgrounds.
 * Place inside a `relative overflow-hidden` section. Pointer-events disabled.
 */
export function HeroDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Soft glow blobs */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-float-slow" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-float-slow-reverse" />
      <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-primary-dark/10 blur-2xl animate-float-slow" />

      {/* Dotted grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          color: "var(--primary-dark)",
        }}
      />

      {/* Floating icons */}
      <FloatIcon
        icon={Smartphone}
        className="left-[6%] top-[28%] text-primary/40"
        size={56}
        delay="0s"
        rotate="-12deg"
      />
      <FloatIcon
        icon={Wrench}
        className="left-[14%] bottom-[18%] text-accent/45"
        size={44}
        delay="-3s"
        rotate="18deg"
        reverse
      />
      <FloatIcon
        icon={Cog}
        className="right-[8%] top-[22%] text-primary-dark/35"
        size={64}
        delay="-6s"
        rotate="8deg"
      />
      <FloatIcon
        icon={Hammer}
        className="right-[16%] bottom-[24%] text-primary/40"
        size={48}
        delay="-2s"
        rotate="-22deg"
        reverse
      />
      <FloatIcon
        icon={Cpu}
        className="left-[42%] top-[12%] text-primary-dark/30"
        size={40}
        delay="-4s"
        rotate="6deg"
      />
      <FloatIcon
        icon={BatteryCharging}
        className="right-[36%] bottom-[10%] text-accent/35"
        size={42}
        delay="-5s"
        rotate="-6deg"
        reverse
      />
      <FloatIcon
        icon={Zap}
        className="left-[24%] top-[14%] text-accent/50"
        size={28}
        delay="-1s"
        rotate="14deg"
      />
      <FloatIcon
        icon={CircuitBoard}
        className="right-[24%] top-[60%] text-primary/35"
        size={50}
        delay="-7s"
        rotate="-10deg"
        reverse
      />
    </div>
  );
}

type IconType = typeof Smartphone;

function FloatIcon({
  icon: Icon,
  className = "",
  size = 40,
  delay = "0s",
  rotate = "0deg",
  reverse = false,
}: {
  icon: IconType;
  className?: string;
  size?: number;
  delay?: string;
  rotate?: string;
  reverse?: boolean;
}) {
  return (
    <div
      className={`absolute hidden sm:block ${reverse ? "animate-float-slow-reverse" : "animate-float-slow"} ${className}`}
      style={{ animationDelay: delay, transform: `rotate(${rotate})` }}
    >
      <Icon size={size} strokeWidth={1.5} />
    </div>
  );
}
