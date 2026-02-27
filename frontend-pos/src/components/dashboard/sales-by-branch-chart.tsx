import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { dashboardApi, type SalesByBranchData } from '@/lib/api/dashboard';

interface SalesByBranchChartProps {
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

export function SalesByBranchChart({
  tenantId,
  outletId,
  startDate,
  endDate,
}: SalesByBranchChartProps) {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dashboard-sales-by-branch', tenantId, outletId, startDate, endDate],
    queryFn: () => dashboardApi.getSalesByBranch({ tenantId, outletId, startDate, endDate }),
  });

  const formatChartData = (data: SalesByBranchData[]) => {
    const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
    return data.map((item) => ({
      branch: item.outletName,
      revenue: item.revenue,
      isTop: item.revenue === maxRevenue && maxRevenue > 0,
    }));
  };

  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}jt`;
    }
    return value.toLocaleString('id-ID');
  };

  const chartData = isLoading ? [] : formatChartData(salesData || []);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">
          Penjualan per Cabang
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[260px] w-full mt-4">
          <BarChart data={chartData} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="branch"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tickFormatter={formatYAxis}
              tick={{ fill: '#6B7280', fontSize: 12 }}
            />
            <ChartTooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  className="bg-gray-900 text-white border-none text-xs"
                  formatter={(value) => `Rp ${Number(value).toLocaleString('id-ID')}`}
                />
              }
            />
            <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.isTop ? '#0B6CE6' : '#E5E7EB'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
