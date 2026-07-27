"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend } from "recharts";
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

type LogbookStatusChartProps = {
  data: {
    name: string;
    approved: number;
    pending: number;
    revision: number;
  }[];
};

export function LogbookStatusChart({ data }: LogbookStatusChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Logbook per Intern</CardTitle>
        <CardDescription>Jumlah entry logbook per status</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={data} barGap={2}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar
              dataKey="approved"
              fill="var(--color-approved)"
              radius={[2, 2, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="pending"
              fill="var(--color-pending)"
              radius={[2, 2, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="revision"
              fill="var(--color-revision)"
              radius={[2, 2, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
