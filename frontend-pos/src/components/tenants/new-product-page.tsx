import { Typography, Spin, Card, Form, Input, InputNumber, message, Button, Space, Select } from "antd";
import { useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { tenantsApi } from "@/lib/api/tenants";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";

const { Title } = Typography;

export function NewProductPage() {
  const { id } = useParams({ from: "/_protected/tenants/$id/products/new" });
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => tenantsApi.getBySlug(id),
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories", tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: {
      tenantId: number;
      sku: string;
      barcode?: string;
      nama: string;
      deskripsi?: string;
      categoryId?: number;
      tipe?: 'barang' | 'jasa' | 'digital';
      hargaBeli?: string;
      hargaJual: string;
      minStockLevel?: number;
      unit?: string;
      isActive?: boolean;
    }) => productsApi.create(data),
    onSuccess: () => {
      message.success("Produk berhasil dibuat");
      navigate({ to: "/tenants/$id", params: { id } });
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal membuat produk");
    },
  });

  const categories = categoriesData?.data || [];

  if (tenantLoading || categoriesLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant tidak ditemukan</div>;
  }

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate({ to: "/tenants/$id", params: { id } })}
        style={{ marginBottom: 16, paddingLeft: 0 }}
      >
        Back to Tenant
      </Button>

      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Title level={4} style={{ margin: 0 }}>
              Tambah Produk Baru
            </Title>
          </div>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => {
            createProductMutation.mutate({
              ...values,
              tenantId: tenant.id,
              hargaJual: values.hargaJual ? String(values.hargaJual) : undefined,
              hargaBeli: values.hargaBeli ? String(values.hargaBeli) : undefined,
            });
          }}
          initialValues={{
            tipe: "barang",
            unit: "pcs",
            minStockLevel: 0,
            isActive: true,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Form.Item
              name="sku"
              label="SKU"
              rules={[{ required: true, message: "SKU wajib diisi" }]}
            >
              <Input placeholder="Contoh: PROD-001" />
            </Form.Item>

            <Form.Item
              name="nama"
              label="Nama Produk"
              rules={[{ required: true, message: "Nama produk wajib diisi" }]}
            >
              <Input placeholder="Contoh: Produk A" />
            </Form.Item>

            <Form.Item name="barcode" label="Barcode">
              <Input placeholder="Contoh: 1234567890123" />
            </Form.Item>

            <Form.Item name="categoryId" label="Kategori">
              <Select placeholder="Pilih kategori" allowClear>
                {categories.map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>
                    {cat.nama}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="tipe"
              label="Tipe Produk"
              rules={[{ required: true, message: "Tipe produk wajib dipilih" }]}
            >
              <Select placeholder="Pilih tipe produk">
                <Select.Option value="barang">Barang</Select.Option>
                <Select.Option value="jasa">Jasa</Select.Option>
                <Select.Option value="digital">Digital</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="unit" label="Satuan">
              <Input placeholder="Contoh: pcs, kg, liter" />
            </Form.Item>

            <Form.Item
              name="hargaJual"
              label="Harga Jual"
              rules={[{ required: true, message: "Harga jual wajib diisi" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Contoh: 100000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value?.replace(/,/g, "") as unknown as number}
              />
            </Form.Item>

            <Form.Item
              name="hargaBeli"
              label="Harga Beli"
              tooltip="Wajib diisi untuk tipe barang"
            >
              <InputNumber
                style={{ width: "100%" }}
                placeholder="Contoh: 50000"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(value) => value?.replace(/,/g, "") as unknown as number}
              />
            </Form.Item>

            <Form.Item name="minStockLevel" label="Minimum Stok">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>

          <Form.Item name="deskripsi" label="Deskripsi" style={{ marginTop: 16 }}>
            <Input.TextArea rows={3} placeholder="Masukkan deskripsi produk" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={createProductMutation.isPending}
              >
                Simpan Produk
              </Button>
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate({ to: "/tenants/$id", params: { id } })}
              >
                Kembali
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
