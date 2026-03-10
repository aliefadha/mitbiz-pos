import { Tag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Category } from '@/lib/api/categories';

interface CategoryInfoCardProps {
  category: Category;
}

export function CategoryInfoCard({ category }: CategoryInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{category.nama}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {category.isActive ? 'Aktif' : 'Tidak Aktif'}
          </span>
        </div>
        <div className="grid grid-cols-2 mx-auto gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 m-0">Nama</p>
            <p className="font-medium m-0">{category.nama}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 m-0">Jumlah Produk</p>
            <p className="font-medium m-0">{category.productsCount ?? 0}</p>
          </div>
        </div>

        {category.deskripsi && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm text-gray-500 m-0 mb-1">Deskripsi</p>
            <p className="m-0">{category.deskripsi}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
