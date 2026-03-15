import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { salesApi, type TopProduct } from '@/lib/api/sales';

interface TopProductsChartProps {
  tenantId?: string;
  outletId?: string;
  startDate?: string;
  endDate?: string;
}

const COLORS = ['#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'];

const chartConfig = {
  value: {
    label: 'Persentase',
  },
} satisfies ChartConfig;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('IDR', 'Rp')
    .trim();
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export function TopProductsChart({
  tenantId,
  outletId,
  startDate,
  endDate,
}: TopProductsChartProps) {
  const { data: topProducts, isLoading } = useQuery({
    queryKey: ['dashboard-top-products', tenantId, outletId, startDate, endDate],
    queryFn: () =>
      salesApi.getTopProducts({
        tenantId,
        outletId,
        startDate,
        endDate,
        limit: 5,
      }),
  });

  const formatChartData = (data: TopProduct[]) => {
    return data.map((item, index) => ({
      name: item.productName,
      value: item.totalQuantity,
      revenue: item.totalRevenue,
      fill: COLORS[index % COLORS.length],
    }));
  };

  const chartData = isLoading ? [] : formatChartData(topProducts || []);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">
          Top 5 Produk Terlaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Donut Chart */}
        <div className="flex items-center justify-center">
          <ChartContainer config={chartConfig} className="h-[240px] w-[240px]">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-gray-900 text-white border-none rounded-lg shadow-lg p-3 text-xs">
                        <p className="font-semibold">{data.name}</p>
                        <p className="mt-1">{formatCurrency(data.revenue)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                label={({ name, cx, cy, midAngle, outerRadius }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 24;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  return (
                    <text
                      x={x}
                      y={y}
                      fill="#374151"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      className="text-xs font-medium"
                    >
                      {name}
                    </text>
                  );
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>

        {/* Legend List */}
        <div className="mt-6 space-y-3 border-t border-gray-100 pt-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-sm text-gray-900 font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.revenue)}
                </span>
                <p className="text-xs text-gray-400">{formatNumber(item.value)} terjual</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
