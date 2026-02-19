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
  message,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  InboxOutlined,
} from "@ant-design/icons";
import { outletsApi } from "@/lib/api/outlets";
import { tenantsApi } from "@/lib/api/tenants";
import { stocksApi, type Stock } from "@/lib/api/stocks";
import { productsApi, type Product } from "@/lib/api/products";

const { Title, Text } = Typography;

// Merged row type: product + optional stock data
interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

export function OutletStockPage() {
  const { outletId } = useParams({
    from: "/_protected/outlets/$outletId",
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProductStockRow | null>(null);
  const [editForm] = Form.useForm();

  const outletIdNum = Number(outletId);

  // Fetch outlet info
  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ["outlet", outletIdNum],
    queryFn: () => outletsApi.getById(outletIdNum),
  });

  // Fetch tenant info (to get slug for navigation)
  const { data: tenantData } = useQuery({
    queryKey: ["tenants", { id: outlet?.tenantId }],
    queryFn: () => tenantsApi.getAll({ tenantId: outlet!.tenantId } as any),
    enabled: !!outlet?.tenantId,
    select: (data) => data?.[0],
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

  const invalidateStocks = () => {
    queryClient.invalidateQueries({
      queryKey: ["stocks", { outletId: outletIdNum }],
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
      invalidateStocks();
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
      invalidateStocks();
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
      invalidateStocks();
      message.success("Stock berhasil dihapus");
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal menghapus stock");
    },
  });

  // --- Merge products with stocks ---
  const stocks = stocksData?.data || [];
  const products = productsData?.data || [];

  const stockByProductId = new Map<number, Stock>();
  stocks.forEach((s: Stock) => stockByProductId.set(s.productId, s));

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

  // --- Table Columns ---
  const columns = [
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
      width: 100,
      render: (_: unknown, record: ProductStockRow) => {
        if (!record.stock) return null;
        return (
          <Space size="small">
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

  if (outletLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  const totalWithStock = rows.filter((r) => r.stock !== null).length;

  return (
    <div>
      {/* Back Navigation */}
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() =>
          navigate({
            to: "/tenants/$slug/outlets" as any,
            params: { slug: tenantData?.slug as any },
          })
        }
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
              <span>Stock — {outlet?.name || "Outlet"}</span>
            </Space>
          }
          column={3}
          size="small"
        >
          <Descriptions.Item label="Kode">
            {outlet?.kode || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Nama">
            {outlet?.name || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Alamat">
            {outlet?.alamat || "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Title level={5} style={{ margin: 0 }}>
            Daftar Produk & Stock
          </Title>
          <Text type="secondary">
            {totalWithStock} dari {products.length} produk memiliki stock di
            outlet ini
          </Text>
        </div>
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
        columns={columns}
        rowKey={(record) => record.product.id}
        loading={stocksLoading || productsLoading}
        pagination={{ pageSize: 10 }}
        size="small"
        locale={{
          emptyText: "Belum ada produk untuk tenant ini.",
        }}
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
    </div>
  );
}
