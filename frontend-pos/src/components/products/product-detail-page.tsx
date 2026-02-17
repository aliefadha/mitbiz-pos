import { Typography, Spin, Card, Tag, Button, Space, Descriptions, Table, Modal, Form, Input, InputNumber, Select, message, Tabs, Row, Col, Statistic, Switch } from "antd";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeftOutlined, PlusOutlined, EditOutlined, ShoppingCartOutlined, HistoryOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { productsApi, type Product, type UpdateProductDto } from "@/lib/api/products";
import { stocksApi } from "@/lib/api/stocks";
import { stockAdjustmentsApi } from "@/lib/api/stock-adjustments";
import { outletsApi } from "@/lib/api/outlets";
import { categoriesApi } from "@/lib/api/categories";

const { Title, Text } = Typography;

function formatRupiah(value: number | string): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function ProductDetailPage() {
  const { id, productId } = useParams({ from: "/_protected/tenants/$id/products/$productId" });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [adjustmentForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => productsApi.getById(Number(productId)),
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", productId],
    queryFn: () => stocksApi.getAll({ productId: Number(productId) }),
    enabled: !!productId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ["stock-adjustments", productId],
    queryFn: () => stockAdjustmentsApi.getAll({ productId: Number(productId) }),
    enabled: !!productId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ["outlets", id],
    queryFn: () => outletsApi.getAll({ tenantId: Number(id) }),
    enabled: !!id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories", id],
    queryFn: () => categoriesApi.getAll({ tenantId: Number(id) }),
    enabled: !!id,
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: { productId: number; outletId: number; quantity: number; alasan?: string }) =>
      stockAdjustmentsApi.create(data),
    onSuccess: () => {
      message.success("Stock adjustment created successfully");
      setAdjustmentModalOpen(false);
      adjustmentForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["stocks", productId] });
      queryClient.invalidateQueries({ queryKey: ["stock-adjustments", productId] });
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to create stock adjustment");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      message.success("Product updated successfully");
      setEditModalOpen(false);
      editForm.resetFields();
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update product");
    },
  });

  const isLoading = productLoading || stocksLoading || adjustmentsLoading;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const stocks = stocksData?.data || [];
  const adjustments = adjustmentsData?.data || [];
  const outlets = outletsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleEdit = () => {
    editForm.setFieldsValue({
      sku: product.sku,
      barcode: product.barcode,
      nama: product.nama,
      deskripsi: product.deskripsi,
      categoryId: product.categoryId,
      tipe: product.tipe,
      hargaBeli: product.hargaBeli ? parseFloat(product.hargaBeli) : 0,
      hargaJual: product.hargaJual ? parseFloat(product.hargaJual) : 0,
      minStockLevel: product.minStockLevel,
      unit: product.unit,
      isActive: product.isActive,
    });
    setEditModalOpen(true);
  };

  const stockColumns = [
    {
      title: "Outlet",
      dataIndex: "outlet",
      key: "outlet",
      render: (outlet: { name: string; kode: string } | undefined) => outlet ? `${outlet.name} (${outlet.kode})` : "-",
    },
    {
      title: "Jumlah",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number) => (
        <Tag color={quantity <= 0 ? "red" : quantity <= product.minStockLevel ? "orange" : "green"}>
          {quantity}
        </Tag>
      ),
    },
    {
      title: "Terakhir Diupdate",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (date: Date) => new Date(date).toLocaleString("id-ID"),
    },
  ];

  const adjustmentColumns = [
    {
      title: "Tanggal",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: Date) => new Date(date).toLocaleString("id-ID"),
    },
    {
      title: "Outlet",
      dataIndex: "outlet",
      key: "outlet",
      render: (outlet: { name: string; kode: string } | undefined) => outlet ? `${outlet.name} (${outlet.kode})` : "-",
    },
    {
      title: "Jumlah",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity: number) => (
        <Tag color={quantity >= 0 ? "green" : "red"}>
          {quantity > 0 ? `+${quantity}` : quantity}
        </Tag>
      ),
    },
    {
      title: "Alasan",
      dataIndex: "alasan",
      key: "alasan",
      render: (reason: string | null) => reason || "-",
    },
    {
      title: "Oleh",
      dataIndex: "user",
      key: "user",
      render: (user: { name: string | null; email: string } | undefined) => user?.name || user?.email || "-",
    },
  ];

  const tipeColors: Record<string, string> = {
    barang: "blue",
    jasa: "purple",
    digital: "cyan",
  };

  const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants/$id", params: { id } })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Kembali ke Tenant
      </Button>

      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Detail Produk
            </Title>
          </div>
        }
        extra={
          <Space>
            <Button 
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              Ubah
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => setAdjustmentModalOpen(true)}
            >
              Tambah Stok
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
          <Descriptions.Item label="Barcode">{product.barcode || "-"}</Descriptions.Item>
          <Descriptions.Item label="Nama">{product.nama}</Descriptions.Item>
          <Descriptions.Item label="Tipe">
            <Tag color={tipeColors[product.tipe] || "default"} className="capitalize">{product.tipe}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kategori">{product.category?.nama || "-"}</Descriptions.Item>
          <Descriptions.Item label="Satuan">{product.unit || "-"}</Descriptions.Item>
          <Descriptions.Item label="Harga Beli">
            {product.hargaBeli ? `Rp ${parseInt(product.hargaBeli).toLocaleString("id-ID")}` : "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Harga Jual">
            Rp {parseInt(product.hargaJual).toLocaleString("id-ID")}
          </Descriptions.Item>
          <Descriptions.Item label="Minimum Stok">{product.minStockLevel}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={product.isActive ? "green" : "red"}>{product.isActive ? "Aktif" : "Nonaktif"}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Deskripsi" span={2}>
            {product.deskripsi || "-"}
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal dibuat">
            {new Date(product.createdAt).toLocaleString("id-ID")}
          </Descriptions.Item>
          <Descriptions.Item label="Tanggal diupdate">
            {new Date(product.updatedAt).toLocaleString("id-ID")}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Total Stok" 
              value={totalStock} 
              prefix={<ShoppingCartOutlined />} 
              valueStyle={{ color: totalStock <= product.minStockLevel ? "#faad14" : "#52c41a" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Minimum Stok" 
              value={product.minStockLevel} 
              valueStyle={{ color: "#1890ff" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Jumlah Outlet" 
              value={stocks.length} 
              valueStyle={{ color: "#722ed1" }}
            />
          </Col>
          <Col xs={12} sm={6}>
            <Statistic 
              title="Jumlah Penyesuaian" 
              value={adjustments.length} 
              prefix={<HistoryOutlined />} 
              valueStyle={{ color: "#eb2f96" }}
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="stocks"
          type="card"
          size="small"
          items={[
            {
              key: "stocks",
              label: (
                <span>
                  <ShoppingCartOutlined /> Stok per Outlet ({stocks.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={stocks}
                  columns={stockColumns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ),
            },
            {
              key: "adjustments",
              label: (
                <span>
                  <HistoryOutlined /> Riwayat Penyesuaian ({adjustments.length})
                </span>
              ),
              children: (
                <Table
                  dataSource={adjustments}
                  columns={adjustmentColumns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="Tambah Penyesuaian Stok"
        open={adjustmentModalOpen}
        onCancel={() => {
          setAdjustmentModalOpen(false);
          adjustmentForm.resetFields();
        }}
        onOk={() => adjustmentForm.submit()}
        confirmLoading={createAdjustmentMutation.isPending}
      >
        <Form
          form={adjustmentForm}
          layout="vertical"
          onFinish={(values) => {
            createAdjustmentMutation.mutate({
              productId: Number(productId),
              outletId: values.outletId,
              quantity: values.quantity,
              alasan: values.alasan,
            });
          }}
        >
          <Form.Item
            name="outletId"
            label="Outlet"
            rules={[{ required: true, message: "Outlet wajib dipilih" }]}
          >
            <Select
              placeholder="Pilih outlet"
              options={outlets.map((outlet) => ({
                value: outlet.id,
                label: `${outlet.name} (${outlet.kode})`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Jumlah"
            rules={[{ required: true, message: "Jumlah wajib diisi" }]}
            extra="Angka positif untuk tambah, negatif untuk kurang"
          >
            <InputNumber
              style={{ width: "100%" }}
              placeholder="Masukkan jumlah"
              min={-1000}
              max={1000}
            />
          </Form.Item>
          <Form.Item
            name="alasan"
            label="Alasan"
          >
            <Input.TextArea rows={2} placeholder="Masukkan alasan (opsional)" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Produk"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={updateMutation.isPending}
        width={600}
        centered
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            const data: UpdateProductDto = {
              ...values,
              hargaBeli: values.hargaBeli ? String(values.hargaBeli) : '0',
              hargaJual: values.hargaJual ? String(values.hargaJual) : '0',
            };
            updateMutation.mutate({
              id: Number(productId),
              data,
            });
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: "SKU wajib diisi" }]}
              >
                <Input placeholder="Contoh: PRD-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label="Barcode">
                <Input placeholder="Contoh: 1234567890123" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="nama"
            label="Nama Produk"
            rules={[{ required: true, message: "Nama produk wajib diisi" }]}
          >
            <Input placeholder="Masukkan nama produk" />
          </Form.Item>
          <Form.Item name="deskripsi" label="Deskripsi">
            <Input.TextArea
              placeholder="Masukkan deskripsi produk (opsional)"
              rows={2}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="categoryId" label="Kategori">
                <Select
                  placeholder="Pilih kategori"
                  options={categories.map((cat) => ({
                    label: cat.nama,
                    value: cat.id,
                  }))}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tipe" label="Tipe">
                <Select
                  placeholder="Pilih tipe"
                  options={[
                    { label: "Barang (Fisik)", value: "barang" },
                    { label: "Jasa (Layanan)", value: "jasa" },
                    { label: "Digital", value: "digital" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="hargaBeli" label="Harga Beli">
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) =>
                    value?.replace(/[^\d]/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="hargaJual" label="Harga Jual">
                <InputNumber
                  placeholder="0"
                  min={0}
                  style={{ width: "100%" }}
                  formatter={(value) => (value ? formatRupiah(value) : "")}
                  parser={(value) =>
                    value?.replace(/[^\d]/g, "") as unknown as number
                  }
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="minStockLevel" label="Minimum Stok">
                <InputNumber min={0} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit" label="Satuan">
                <Input placeholder="pcs, kg, L" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="isActive" label="Status" valuePropName="checked">
            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
