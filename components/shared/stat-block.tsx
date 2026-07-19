"use client";

import * as React from "react";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types / context
// ---------------------------------------------------------------------------

type StatSingleData = {
  value: number | string;
  format?: (value: number) => string;
};

type StatRangeData = {
  current: number;
  previous: number;
  format?: (value: number) => string;
};

type StatBlockContextValue = {
  mode: "single" | "range";
  data?: StatSingleData | StatRangeData;
};

const StatBlockContext = React.createContext<StatBlockContextValue | null>(
  null,
);

function useStatBlockContext(component: string) {
  const ctx = React.useContext(StatBlockContext);
  if (!ctx) throw new Error(`<${component}> must be used within <StatBlock>.`);
  return ctx;
}

// ---------------------------------------------------------------------------
// Slot factory — Base UI render-prop pattern + shadcn data-slot styling hook
// ---------------------------------------------------------------------------

function createSlot(
  defaultTagName: keyof React.JSX.IntrinsicElements,
  slotName: string,
  base: string,
) {
  return React.forwardRef<
    HTMLElement,
    useRender.ComponentProps<typeof defaultTagName>
  >(function Slot({ className, render, ...props }, ref) {
    return useRender({
      defaultTagName,
      ref,
      render,
      props: {
        "data-slot": slotName,
        className: cn(base, className),
        ...props,
      },
    });
  });
}

// ---------------------------------------------------------------------------
// StatBlock — root
// ---------------------------------------------------------------------------

interface StatBlockProps extends useRender.ComponentProps<"div"> {
  mode: "single" | "range";
  data?: StatSingleData | StatRangeData;
}

const StatBlock = React.forwardRef<HTMLDivElement, StatBlockProps>(
  function StatBlock({ mode, data, className, render, ...props }, ref) {
    const element = useRender({
      defaultTagName: "div",
      ref,
      render,
      props: {
        "data-slot": "stat-block",
        className: cn(
          "flex flex-col gap-3 border bg-card p-4 text-card-foreground shadow-sm",
          className,
        ),
        ...props,
      },
    });
    return (
      <StatBlockContext.Provider value={{ mode, data }}>
        {element}
      </StatBlockContext.Provider>
    );
  },
);

// ---------------------------------------------------------------------------
// StatHeader -> StatIcon, StatTitle, StatDescription
// ---------------------------------------------------------------------------

const StatHeader = createSlot("div", "stat-header", "flex items-start gap-3");

interface StatIconProps extends useRender.ComponentProps<"div"> {
  icon?: React.ReactNode;
}

const StatIcon = React.forwardRef<HTMLDivElement, StatIconProps>(
  function StatIcon(
    { icon: Icon, className, render, children, ...props },
    ref,
  ) {
    return useRender({
      defaultTagName: "div",
      ref,
      render,
      props: {
        "data-slot": "stat-icon",
        className: cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
          className,
        ),
        children: children ?? (Icon ? Icon : null),
        ...props,
      },
    });
  },
);

const StatTitle = createSlot(
  "h3",
  "stat-title",
  "text-sm font-medium leading-none",
);

const StatDescription = createSlot(
  "p",
  "stat-description",
  "text-xs text-muted-foreground",
);

// ---------------------------------------------------------------------------
// StatContent -> StatMain -> StatValue, StatSubValue
// ---------------------------------------------------------------------------

const StatContent = createSlot("div", "stat-content", "flex flex-col gap-1");

const StatMain = createSlot("div", "stat-main", "flex items-baseline gap-2");

function defaultFormat(value: number) {
  return value.toLocaleString();
}

const StatValue = React.forwardRef<
  HTMLSpanElement,
  useRender.ComponentProps<"span">
>(function StatValue({ className, render, children, ...props }, ref) {
  const { mode, data } = useStatBlockContext("StatValue");

  let content = children;
  if (content == null && data) {
    if (mode === "single") {
      const d = data as StatSingleData;
      content =
        typeof d.value === "number"
          ? (d.format ?? defaultFormat)(d.value)
          : d.value;
    } else {
      const d = data as StatRangeData;
      content = (d.format ?? defaultFormat)(d.current);
    }
  }

  return useRender({
    defaultTagName: "span",
    ref,
    render,
    props: {
      "data-slot": "stat-value",
      className: cn(
        "text-2xl font-semibold tracking-tight tabular-nums",
        className,
      ),
      children: content,
      ...props,
    },
  });
});

const subValueVariants = cva(
  "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
  {
    variants: {
      trend: {
        up: "text-emerald-600 dark:text-emerald-400",
        down: "text-rose-600 dark:text-rose-400",
        flat: "text-muted-foreground",
      },
      variant: {
        default: "",
        badge: "px-1.5 py-0.5",
      },
    },
    compoundVariants: [
      { variant: "badge", trend: "up", class: "bg-emerald-500/10" },
      { variant: "badge", trend: "down", class: "bg-rose-500/10" },
      { variant: "badge", trend: "flat", class: "bg-muted" },
    ],
    defaultVariants: { trend: "flat", variant: "default" },
  },
);

const trendIcon: Record<
  NonNullable<VariantProps<typeof subValueVariants>["trend"]>,
  LucideIcon
> = {
  up: ArrowUp,
  down: ArrowDown,
  flat: Minus,
};

interface StatSubValueProps extends useRender.ComponentProps<"span"> {
  /** "default" = plain text, "badge" = pill with tinted background. */
  variant?: "default" | "badge";
  /** true = show % change vs previous. false (default) = show the previous value itself. */
  asPercentage?: boolean;
  /** Prefix the value with +/- based on trend direction. Defaults to true. */
  displayPolarity?: boolean;
}

const StatSubValue = React.forwardRef<HTMLSpanElement, StatSubValueProps>(
  function StatSubValue(
    {
      className,
      render,
      children,
      variant = "default",
      asPercentage = false,
      displayPolarity = true,
      ...props
    },
    ref,
  ) {
    const { mode, data } = useStatBlockContext("StatSubValue");

    let content: React.ReactNode = children;
    let trend: VariantProps<typeof subValueVariants>["trend"] = "flat";

    if (content == null && mode === "range" && data) {
      const d = data as StatRangeData;
      const format = d.format ?? defaultFormat;
      const delta = d.current - d.previous;

      trend = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      const sign = displayPolarity
        ? trend === "up"
          ? "+"
          : trend === "down"
            ? "-"
            : ""
        : "";

      const pct =
        d.previous !== 0 ? (Math.abs(delta) / Math.abs(d.previous)) * 100 : 0;
      const valueText = asPercentage
        ? `${sign}${pct.toFixed(1)}%`
        : `${sign}${format(d.previous)}`;

      const Icon = trendIcon[trend];
      content = (
        <>
          <Icon className="w-3 h-3" />
          {valueText}
        </>
      );
    }

    // useRender must run unconditionally on every render (rules-of-hooks),
    // so we build the element first and decide whether to return it after.
    const element = useRender({
      defaultTagName: "span",
      ref,
      render,
      props: {
        "data-slot": "stat-sub-value",
        className: cn(subValueVariants({ trend, variant }), className),
        children: content,
        ...props,
      },
    });

    if (content == null) return null;
    return element;
  },
);

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export {
  StatBlock,
  StatHeader,
  StatIcon,
  StatTitle,
  StatDescription,
  StatContent,
  StatMain,
  StatValue,
  StatSubValue,
};

/* Usage
<StatBlock mode="range" data={{ current: 4231, previous: 3890 }}>
  <StatHeader>
    <StatIcon icon={Users} />
    <div>
      <StatTitle>Active Users</StatTitle>
      <StatDescription>Last 30 days</StatDescription>
    </div>
  </StatHeader>
  <StatContent>
    <StatMain>
      <StatValue />
      <StatSubValue />
    </StatMain>
  </StatContent>
</StatBlock>
*/
