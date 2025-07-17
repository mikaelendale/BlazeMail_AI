import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
interface UsageDataPoint {
    date: string // YYYY-MM-DD
    usage: number // Credits used on that date
}

interface UsageChartProps {
    data: UsageDataPoint[]
}

export default function UsageChart({ data }: UsageChartProps) {
    // If using a library like Recharts:
    const chartData = data.map(item => ({
        name: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        'Credits Used': item.usage,
    }));

    const chartConfig = {
        desktop: {
            label: "Desktop",
            color: "var(--chart-1)",
        },
    } satisfies ChartConfig

    return (
        <Card>
            <CardHeader>
                <CardTitle>Area Chart</CardTitle>
                <CardDescription>
                    Daily Credit Usage (Last {data.length} Days)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Placeholder for a real chart */}
                {data.length > 0 ? (
                    
                            <ChartContainer config={chartConfig}>
                                <AreaChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="line" />}
                                    />
                                    <Area
                                        dataKey="Credits Used"
                                        type="natural"
                                        fill="var(--color-desktop)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-desktop)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        No credit usage data for the last {data.length} days.
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
