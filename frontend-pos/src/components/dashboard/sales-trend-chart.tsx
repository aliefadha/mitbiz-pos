import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { dashboardApi, type SalesTrendData } from '@/lib/api/dashboard';

interface SalesTrendChartProps {
  tenantId?: string;
  outletId?: string;
  startDate?: string;
  endDate?: string;
}

const chartConfig = {
  revenue: {
    label: 'Penjualan',
    color: '#0B6CE6',
  },
} satisfies ChartConfig;

export function SalesTrendChart({ tenantId, outletId, startDate, endDate }: SalesTrendChartProps) {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dashboard-sales-trend', tenantId, outletId, startDate, endDate],
    queryFn: () => dashboardApi.getSalesTrend({ tenantId, outletId, startDate, endDate }),
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const formatChartData = (data: SalesTrendData[]) => {
    return data.map((item) => ({
      date: formatDate(item.date),
      revenue: item.revenue,
    }));
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}jt`;
    }
    return value.toLocaleString('id-ID');
  };

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">
          Tren Penjualan Harian (30 Hari)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full mt-4">
          <AreaChart data={isLoading ? [] : formatChartData(salesData || [])}>
            <defs>
              <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0B6CE6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#0B6CE6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={16}
              tickFormatter={formatYAxis}
              tick={{ fill: '#6B7280', fontSize: 12 }}
              width={80}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  className="bg-gray-900 text-white border-none text-xs"
                  formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#0B6CE6"
              strokeWidth={2}
              fill="url(#fillTotal)"
              animationDuration={1000}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
