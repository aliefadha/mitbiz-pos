import { Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryStatsProps {
  totalCategories: number;
  categoryAktif: number;
  categoryNonaktif: number;
}

export function CategoryStats({
  totalCategories,
  categoryAktif,
  categoryNonaktif,
}: CategoryStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Kategori</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalCategories}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kategori Aktif</CardTitle>
          <Tag className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categoryAktif}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kategori Nonaktif</CardTitle>
          <Tag className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{categoryNonaktif}</div>
        </CardContent>
      </Card>
    </div>
  );
}
