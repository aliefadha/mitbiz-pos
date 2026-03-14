import { createFileRoute } from '@tanstack/react-router';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { useStocksPage } from '@/components/stocks/hooks/use-stocks-page';
import { StockList } from '@/components/stocks/stock-list';
import { StockStats } from '@/components/stocks/stock-stats';
import { checkAllPermissions, ForbiddenError } from '@/lib/permissions';

function StockPage() {
  const {
    searchQuery,
    productFilter,
    outletFilter,
    currentPage,
    pageSize,
    stocksLoading,
    displayedStocks,
    products,
    outlets,
    totalProduk,
    stokMenipis,
    stokHabis,
    totalPages,
    total,
    getStockStatusColor,
    getStockStatusText,
    handleSearchChange,
    handleProductFilterChange,
    handleOutletFilterChange,
    handlePageChange,
    handlePageSizeChange,
  } = useStocksPage();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Manajemen Inventori</h4>
          <p className="text-sm text-gray-500 m-0">Monitor dan kelola stok produk per cabang</p>
        </div>
      </div>

      <StockStats totalProduk={totalProduk} stokMenipis={stokMenipis} stokHabis={stokHabis} />

      <StockList
        displayedStocks={displayedStocks}
        isLoading={stocksLoading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        productFilter={productFilter}
        outletFilter={outletFilter}
        products={products}
        outlets={outlets}
        getStockStatusColor={getStockStatusColor}
        getStockStatusText={getStockStatusText}
        onSearchChange={handleSearchChange}
        onProductFilterChange={handleProductFilterChange}
        onOutletFilterChange={handleOutletFilterChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/stocks/')({
  component: StockPage,
  beforeLoad: async () => {
    const { allowed } = await checkAllPermissions([
      { resource: 'stocks', action: 'read' },
      { resource: 'products', action: 'read' },
    ]);
    if (!allowed) {
      throw new ForbiddenError('stocks');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});
