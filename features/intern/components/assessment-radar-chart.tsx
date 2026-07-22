"use client";
import { Loader2, TrendingUp } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AssessmentViewComponent } from "@/features/supervisor/types/assessment-view-types";

export const description = "A radar chart with dots";

const chartConfig = {
  score: {
    label: "Score",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type AssessementRadarChartProps = {
  data: AssessmentViewComponent[] | undefined | null;
};

export function AssessementRadarChart(props: AssessementRadarChartProps) {
  const chartData = props.data;
  const isLoading = !chartData || chartData.length === 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="items-center">
          <CardTitle>Chart Penilaian</CardTitle>
          <CardDescription>
            Menampilkan skor penilaian per kategori (skala 0-100)
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center pb-0 min-h-[350px]">
          <Loader2 className="animate-spin size-6 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="items-center">
        <CardTitle>Chart Penilaian</CardTitle>
        <CardDescription>
          Menampilkan skor penilaian per kategori (skala 0-100)
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[350px] w-full"
        >
          <RadarChart data={chartData} outerRadius="65%">
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarGrid />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="score"
              fill="var(--color-score)"
              fillOpacity={0.6}
              dot={{
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
