import { useQuery } from '@tanstack/react-query';
import { Cell, Pie, PieChart, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ChartConfig, ChartContainer } from '@/components/ui/chart';
import { dashboardApi, type SalesByPaymentMethodData } from '@/lib/api/dashboard';

interface SalesByPaymentMethodChartProps {
  tenantId?: string;
  outletId?: string;
  startDate?: string;
  endDate?: string;
}

const COLORS = [
  '#00C99D',
  '#FF9900',
  '#F04438',
  '#9D50FF',
  '#0B6CE6',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
];

const chartConfig = {
  value: {
    label: 'Persentase',
  },
} satisfies ChartConfig;

export function SalesByPaymentMethodChart({
  tenantId,
  outletId,
  startDate,
  endDate,
}: SalesByPaymentMethodChartProps) {
  const { data: salesData, isLoading } = useQuery({
    queryKey: ['dashboard-sales-by-payment-method', tenantId, outletId, startDate, endDate],
    queryFn: () => dashboardApi.getSalesByPaymentMethod({ tenantId, outletId, startDate, endDate }),
  });

  const formatChartData = (data: SalesByPaymentMethodData[]) => {
    const total = data.reduce((sum, item) => sum + item.revenue, 0);
    return data.map((item, index) => ({
      name: item.paymentMethodName,
      value: total > 0 ? Math.round((item.revenue / total) * 100) : 0,
      revenue: item.revenue,
      fill: COLORS[index % COLORS.length],
    }));
  };

  const chartData = isLoading ? [] : formatChartData(salesData || []);

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">
          Penjualan per Metode Pembayaran
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between pb-6">
        <div className="flex flex-col gap-3 w-1/2 mt-4 ml-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-sm text-gray-600 font-medium">
                {item.name} - {item.value}%
              </span>
            </div>
          ))}
        </div>
        <div className="w-1/2 pr-4">
          <ChartContainer config={chartConfig} className="h-[220px] w-full">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border rounded shadow p-2 text-xs font-medium">
                        {payload[0].name}: {payload[0].value}%
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
