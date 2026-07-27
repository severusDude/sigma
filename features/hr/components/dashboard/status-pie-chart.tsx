"use client";

import { Pie, PieChart } from "recharts";
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
import type { InternStatusCount } from "../../types/dashboard-types";

const chartConfig = {
  active: {
    label: "Aktif",
    color: "var(--chart-2)",
  },
  completed: {
    label: "Selesai",
    color: "var(--chart-3)",
  },
  withdrawn: {
    label: "Dicabut",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type StatusPieChartProps = {
  data: InternStatusCount[];
};

export function StatusPieChart({ data }: StatusPieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Intern</CardTitle>
        <CardDescription>Distribusi status seluruh intern</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="status"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
