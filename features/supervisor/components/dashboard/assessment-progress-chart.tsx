"use client";

import { Cell, Pie, PieChart } from "recharts";
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
  assessed: { label: "Sudah Dinilai", color: "var(--chart-3)" },
  notAssessed: { label: "Belum Dinilai", color: "var(--chart-4)" },
} satisfies ChartConfig;

type AssessmentProgressChartProps = {
  data: { assessed: number; notAssessed: number };
};

export function AssessmentProgressChart({
  data,
}: AssessmentProgressChartProps) {
  const chartData = [
    { name: "assessed", value: data.assessed },
    { name: "notAssessed", value: data.notAssessed },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Penilaian</CardTitle>
        <CardDescription>Intern sudah vs belum dinilai</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={`var(--color-${entry.name})`} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
