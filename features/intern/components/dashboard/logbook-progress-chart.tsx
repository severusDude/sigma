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

const chartConfig = {
  approved: { label: "Disetujui", color: "var(--chart-2)" },
  pending: { label: "Menunggu", color: "var(--chart-5)" },
  revision: { label: "Revisi", color: "var(--chart-4)" },
} satisfies ChartConfig;

type LogbookProgressChartProps = {
  data: {
    week: string;
    approved: number;
    pending: number;
    revision: number;
  }[];
};

export function LogbookProgressChart({ data }: LogbookProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Logbook</CardTitle>
        <CardDescription>Entry logbook per minggu</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-[3/1]">
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              fontSize={10}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="approved"
              type="monotone"
              stroke="var(--color-approved)"
              fill="var(--color-approved)"
              fillOpacity={0.3}
              stackId="1"
            />
            <Area
              dataKey="pending"
              type="monotone"
              stroke="var(--color-pending)"
              fill="var(--color-pending)"
              fillOpacity={0.3}
              stackId="1"
            />
            <Area
              dataKey="revision"
              type="monotone"
              stroke="var(--color-revision)"
              fill="var(--color-revision)"
              fillOpacity={0.3}
              stackId="1"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
