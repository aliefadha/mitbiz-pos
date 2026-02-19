import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  InputNumber,
  Table,
  Modal,
  Form,
  Typography,
  Space,
  Tag,
  Tooltip,
  Card,
  Descriptions,
  Spin,
  Tabs,
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
  HistoryOutlined,
  SwapOutlined,
} from "@ant-design/icons";
import { outletsApi } from "@/lib/api/outlets";
import { stocksApi, type Stock } from "@/lib/api/stocks";
import { productsApi, type Product } from "@/lib/api/products";
import {
  stockAdjustmentsApi,
  type StockAdjustment,
} from "@/lib/api/stock-adjustments";
import { useSession } from "@/lib/auth-client";

const { Text } = Typography;

interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

export function OutletDetailPage() {
  const { slug, outletId } = useParams({
    from: "/_protected/tenants/$slug/outlets/$outletId",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchText, setSearchText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProductStockRow | null>(null);
  const [adjustingRow, setAdjustingRow] = useState<ProductStockRow | null>(
    null,
  );
  const [editForm] = Form.useForm();
  const [adjustForm] = Form.useForm();

  const outletIdNum = Number(outletId);

  // Fetch outlet info
  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ["outlet", outletIdNum],
    queryFn: () => outletsApi.getById(outletIdNum),
  });

  // Fetch stocks for this outlet
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", { outletId: outletIdNum }],
    queryFn: () => stocksApi.getAll({ outletId: outletIdNum }),
    enabled: !!outletIdNum,
  });

  // Fetch all products for this tenant (derived from outlet's tenantId)
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", outlet?.tenantId],
    queryFn: () => productsApi.getAll({ tenantId: outlet!.tenantId }),
    enabled: !!outlet?.tenantId,
  });

  // Fetch stock adjustments for this outlet
  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ["stock-adjustments", { outletId: outletIdNum }],
    queryFn: () => stockAdjustmentsApi.getAll({ outletId: outletIdNum }),
    enabled: !!outletIdNum,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: ["stocks", { outletId: outletIdNum }],
    });
    queryClient.invalidateQueries({
      queryKey: ["stock-adjustments", { outletId: outletIdNum }],
    });
  };

  // --- Mutations ---
  const createStockMutation = useMutation({
    mutationFn: (data: {
      productId: number;
      outletId: number;
      quantity: number;
    }) => stocksApi.create(data),
    onSuccess: () => {
      invalidateAll();
      message.success("Stock berhasil ditambahkan");
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal menambahkan stock");
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({
      stockId,
      quantity,
    }: {
      stockId: number;
      quantity: number;
    }) => stocksApi.update(stockId, { quantity }),
    onSuccess: () => {
      invalidateAll();
      message.success("Stock berhasil diperbarui");
      setIsEditModalOpen(false);
      setEditingRow(null);
      editForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal memperbarui stock");
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: (stockId: number) => stocksApi.delete(stockId),
    onSuccess: () => {
      invalidateAll();
      message.success("Stock berhasil dihapus");
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal menghapus stock");
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: {
      productId: number;
      outletId: number;
      quantity: number;
      alasan?: string;
      adjustedBy: string;
    }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      invalidateAll();
      message.success("Stock adjustment berhasil dibuat");
      setIsAdjustModalOpen(false);
      setAdjustingRow(null);
      adjustForm.resetFields();
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal membuat stock adjustment");
    },
  });

  // --- Merge products with stocks ---
  const stocks = stocksData?.data || [];
  const products = productsData?.data || [];
  const adjustments = adjustmentsData?.data || [];

  const stockByProductId = new Map<number, Stock>();
  stocks.forEach((s: Stock) => stockByProductId.set(s.productId, s));

  // Build product name map for adjustments table
  const productMap = new Map<number, Product>();
  products.forEach((p: Product) => productMap.set(p.id, p));

  const rows: ProductStockRow[] = products.map((product: Product) => ({
    product,
    stock: stockByProductId.get(product.id) || null,
  }));

  // Search filter
  const filteredRows = rows.filter((row) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      row.product.nama.toLowerCase().includes(search) ||
      row.product.sku.toLowerCase().includes(search)
    );
  });

  // --- Handlers ---
  const handleAddStock = (productId: number) => {
    createStockMutation.mutate({
      productId,
      outletId: outletIdNum,
      quantity: 0,
    });
  };

  const handleEditStock = (row: ProductStockRow) => {
    setEditingRow(row);
    editForm.setFieldsValue({ quantity: row.stock?.quantity || 0 });
    setIsEditModalOpen(true);
  };

  const handleDeleteStock = (stockId: number) => {
    Modal.confirm({
      title: "Hapus Stock",
      content:
        "Apakah Anda yakin ingin menghapus stock ini? Tindakan ini tidak dapat dibatalkan.",
      okText: "Hapus",
      okType: "danger",
      cancelText: "Batal",
      onOk: () => deleteStockMutation.mutate(stockId),
    });
  };

  const handleAdjustStock = (row: ProductStockRow) => {
    setAdjustingRow(row);
    adjustForm.resetFields();
    setIsAdjustModalOpen(true);
  };

  // --- Stock Table Columns ---
  const stockColumns = [
    {
      title: "No.",
      key: "index",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: "SKU",
      key: "sku",
      width: 120,
      render: (_: unknown, record: ProductStockRow) => (
        <Text code>{record.product.sku}</Text>
      ),
    },
    {
      title: "Produk",
      key: "product",
      render: (_: unknown, record: ProductStockRow) => (
        <div>
          <Text strong>{record.product.nama}</Text>
          {record.product.category && (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.product.category.nama}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Harga Jual",
      key: "hargaJual",
      width: 140,
      render: (_: unknown, record: ProductStockRow) => (
        <Text>
          {Number(record.product.hargaJual).toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
          })}
        </Text>
      ),
    },
    {
      title: "Stock",
      key: "stock",
      width: 150,
      sorter: (a: ProductStockRow, b: ProductStockRow) =>
        (a.stock?.quantity ?? -1) - (b.stock?.quantity ?? -1),
      render: (_: unknown, record: ProductStockRow) => {
        if (!record.stock) {
          return (
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              loading={
                createStockMutation.isPending &&
                (createStockMutation.variables as any)?.productId ===
                  record.product.id
              }
              onClick={() => handleAddStock(record.product.id)}
            >
              Tambah
            </Button>
          );
        }
        const qty = record.stock.quantity;
        return (
          <Tag
            color={qty > 0 ? "green" : "red"}
            style={{ fontSize: 14, padding: "2px 12px" }}
          >
            {qty}
          </Tag>
        );
      },
    },
    {
      title: "Terakhir Diperbarui",
      key: "updatedAt",
      width: 180,
      render: (_: unknown, record: ProductStockRow) => (
        <Text type="secondary">
          {record.stock?.updatedAt
            ? new Date(record.stock.updatedAt).toLocaleString("id-ID")
            : "-"}
        </Text>
      ),
    },
    {
      title: "Aksi",
      key: "actions",
      width: 140,
      render: (_: unknown, record: ProductStockRow) => {
        if (!record.stock) return null;
        return (
          <Space size="small">
            <Tooltip title="Adjust stock">
              <Button
                type="text"
                icon={<SwapOutlined />}
                onClick={() => handleAdjustStock(record)}
              />
            </Tooltip>
            <Tooltip title="Edit quantity">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleEditStock(record)}
              />
            </Tooltip>
            <Tooltip title="Hapus stock">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteStock(record.stock!.id)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  // --- Adjustment History Columns ---
  const adjustmentColumns = [
    {
      title: "No.",
      key: "index",
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (
        <Text type="secondary">{index + 1}</Text>
      ),
    },
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 180,
      render: (value: string) => (
        <Text type="secondary">{new Date(value).toLocaleString("id-ID")}</Text>
      ),
    },
    {
      title: "Produk",
      dataIndex: "productId",
      key: "product",
      render: (productId: number, record: StockAdjustment) => {
        const product = productMap.get(productId);
        if (record.product) {
          return (
            <div>
              <Text strong>{record.product.nama}</Text>
              <div>
                <Text type="secondary" code style={{ fontSize: 11 }}>
                  {record.product.sku}
                </Text>
              </div>
            </div>
          );
        }
        if (product) {
          return (
            <div>
              <Text strong>{product.nama}</Text>
              <div>
                <Text type="secondary" code style={{ fontSize: 11 }}>
                  {product.sku}
                </Text>
              </div>
            </div>
          );
        }
        return <Text type="secondary">Product #{productId}</Text>;
      },
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      width: 120,
      render: (value: number) => (
        <Tag
          color={value > 0 ? "green" : value < 0 ? "red" : "default"}
          style={{ fontSize: 14, padding: "2px 12px" }}
        >
          {value > 0 ? `+${value}` : value}
        </Tag>
      ),
    },
    {
      title: "Alasan",
      dataIndex: "alasan",
      key: "alasan",
      render: (value: string | null) => (
        <Text type="secondary">{value || "-"}</Text>
      ),
    },
    {
      title: "Oleh",
      key: "adjustedBy",
      width: 160,
      render: (_: unknown, record: StockAdjustment) => (
        <Text type="secondary">
          {record.user?.name || record.user?.email || record.adjustedBy || "-"}
        </Text>
      ),
    },
  ];

  if (outletLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!outlet) {
    return <div>Outlet not found</div>;
  }

  const totalWithStock = rows.filter((r) => r.stock !== null).length;

  return (
    <div>
      {/* Back Navigation */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: `/tenants/${slug}/outlets` })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to Outlets
      </Button>

      {/* Outlet Info Card */}
      <Card style={{ marginBottom: 24 }}>
        <Descriptions
          title={
            <Space>
              <InboxOutlined />
              <span>{outlet.name}</span>
            </Space>
          }
          column={3}
          size="small"
        >
          <Descriptions.Item label="Kode">{outlet.kode}</Descriptions.Item>
          <Descriptions.Item label="Alamat">
            {outlet.alamat || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="No. HP">
            {outlet.noHp || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={outlet.isActive ? "success" : "error"}>
              {outlet.isActive ? "Active" : "Inactive"}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Tabs: Stock & Adjustments */}
      <Tabs
        defaultActiveKey="stock"
        items={[
          {
            key: "stock",
            label: (
              <Space>
                <InboxOutlined />
                Daftar Produk & Stock
              </Space>
            ),
            children: (
              <>
                {/* Stock Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <Text type="secondary">
                    {totalWithStock} dari {products.length} produk memiliki
                    stock di outlet ini
                  </Text>
                </div>

                {/* Search */}
                <div style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="Cari produk..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{ maxWidth: 300 }}
                    allowClear
                  />
                </div>

                {/* Products + Stock Table */}
                <Table
                  dataSource={filteredRows}
                  columns={stockColumns}
                  rowKey={(record) => record.product.id}
                  loading={stocksLoading || productsLoading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  locale={{
                    emptyText: "Belum ada produk untuk tenant ini.",
                  }}
                />
              </>
            ),
          },
          {
            key: "adjustments",
            label: (
              <Space>
                <HistoryOutlined />
                Riwayat Adjustment
              </Space>
            ),
            children: (
              <>
                <div style={{ marginBottom: 16 }}>
                  <Text type="secondary">
                    Riwayat perubahan stock di outlet ini
                  </Text>
                </div>
                <Table
                  dataSource={adjustments}
                  columns={adjustmentColumns}
                  rowKey="id"
                  loading={adjustmentsLoading}
                  pagination={{ pageSize: 10 }}
                  size="small"
                  locale={{
                    emptyText: "Belum ada riwayat adjustment.",
                  }}
                />
              </>
            ),
          },
        ]}
      />

      {/* Edit Stock Modal */}
      <Modal
        title={`Edit Stock — ${editingRow?.product.nama || ""}`}
        open={isEditModalOpen}
        onOk={() => {
          editForm.validateFields().then((values) => {
            if (editingRow?.stock) {
              updateStockMutation.mutate({
                stockId: editingRow.stock.id,
                quantity: values.quantity,
              });
            }
          });
        }}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRow(null);
          editForm.resetFields();
        }}
        confirmLoading={updateStockMutation.isPending}
        okText="Simpan"
        cancelText="Batal"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: "Masukkan quantity" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        title={`Adjust Stock — ${adjustingRow?.product.nama || ""}`}
        open={isAdjustModalOpen}
        onOk={() => {
          adjustForm.validateFields().then((values) => {
            if (adjustingRow) {
              createAdjustmentMutation.mutate({
                productId: adjustingRow.product.id,
                outletId: outletIdNum,
                quantity: values.quantity,
                alasan: values.alasan || undefined,
                adjustedBy: userId!,
              });
            }
          });
        }}
        onCancel={() => {
          setIsAdjustModalOpen(false);
          setAdjustingRow(null);
          adjustForm.resetFields();
        }}
        confirmLoading={createAdjustmentMutation.isPending}
        okText="Simpan"
        cancelText="Batal"
      >
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Stock saat ini:{" "}
            <Text strong>{adjustingRow?.stock?.quantity ?? 0}</Text>
          </Text>
        </div>
        <Form form={adjustForm} layout="vertical">
          <Form.Item
            name="quantity"
            label="Jumlah Adjustment"
            rules={[{ required: true, message: "Masukkan jumlah adjustment" }]}
            help="Gunakan angka positif untuk menambah, negatif untuk mengurangi"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Contoh: 10 atau -5"
            />
          </Form.Item>
          <Form.Item name="alasan" label="Alasan">
            <Input.TextArea
              rows={2}
              placeholder="Contoh: Restock dari supplier, Barang rusak, dll."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
