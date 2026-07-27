"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { WeeklyFillRate } from "../../types/dashboard-types";

const chartConfig = {
  rate: {
    label: "Fill Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type FillRateChartProps = {
  data: WeeklyFillRate[];
};

export function FillRateChart({ data }: FillRateChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tren Pengisian Logbook</CardTitle>
        <CardDescription>
          Rata-rata filling rate per minggu (12 minggu)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[3/1]">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="rate"
              type="monotone"
              stroke="var(--color-rate)"
              fill="var(--color-rate)"
              fillOpacity={0.2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
