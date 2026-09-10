import { cn } from "@/lib/utils";

interface MiniBarsProps {
  data: number[];
  secondary?: number[];
  className?: string;
  barClassName?: string;
  secondaryBarClassName?: string;
}

export function MiniBars({
  data,
  secondary,
  className,
  barClassName = "bg-info/70",
  secondaryBarClassName = "bg-danger",
}: MiniBarsProps) {
  const max = Math.max(...data, ...(secondary ?? []), 1);

  return (
    <div
      className={cn("flex h-full items-end gap-[3px]", className)}
      aria-hidden
    >
      {data.map((value, index) => {
        const height = (value / max) * 100;
        const secondaryValue = secondary?.[index] ?? 0;
        const secondaryHeight = value > 0 ? (secondaryValue / value) * 100 : 0;

        return (
          <div
            key={index}
            className="relative flex h-full flex-1 items-end overflow-hidden rounded-[2px] bg-white/[0.03]"
          >
            <div
              className={cn("relative w-full rounded-[2px]", barClassName)}
              style={{ height: `${Math.max(height, 2)}%` }}
            >
              {secondary ? (
                <div
                  className={cn(
                    "absolute bottom-0 left-0 w-full rounded-[2px]",
                    secondaryBarClassName,
                  )}
                  style={{ height: `${secondaryHeight}%` }}
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
