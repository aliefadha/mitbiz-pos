import { Typography, Form, Input, Button, Card, message, Space } from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { tenantsApi } from "@/lib/api/tenants";
import { useSession } from "@/lib/auth-client";
import { generateSlug } from "@/lib/utils";

const { Title, Text } = Typography;

interface CreateTenantFormValues {
  nama: string;
  slug: string;
  noHp?: string;
  alamat?: string;
}

export function CreateTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form] = Form.useForm<CreateTenantFormValues>();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const createMutation = useMutation({
    mutationFn: (data: CreateTenantFormValues) =>
      tenantsApi.create({ ...data, userId: userId! }, userId),
    onSuccess: (tenant) => {
      message.success("Tenant berhasil dibuat");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      navigate({ to: `/tenants/${tenant.slug}` });
    },
    onError: (error: Error) => {
      message.error(error.message || "Gagal membuat tenant");
    },
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate({ to: "/tenants" })}
        />
        <div>
          <Title level={4} style={{ margin: 0 }}>
            Tambah Tenant Baru
          </Title>
          <Text type="secondary">
            Isi data tenant untuk mendaftarkan usaha baru
          </Text>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => createMutation.mutate(values)}
          requiredMark="optional"
        >
          <Form.Item
            name="nama"
            label="Nama Tenant"
            rules={[{ required: true, message: "Nama tenant wajib diisi" }]}
          >
            <Input
              placeholder="Masukkan nama tenant"
              onChange={(e) => {
                const slug = generateSlug(e.target.value);
                form.setFieldValue("slug", slug);
              }}
            />
          </Form.Item>
          <Form.Item name="slug" hidden />
          <Form.Item
            name="noHp"
            label="No. HP"
            rules={[
              {
                pattern: /^(\+62|62|0)?[0-9]{9,14}$/,
                message: "Masukkan nomor HP yang valid",
              },
            ]}
          >
            <Input placeholder="contoh: 081234567890" />
          </Form.Item>
          <Form.Item name="alamat" label="Alamat">
            <Input.TextArea rows={3} placeholder="Masukkan alamat tenant" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={createMutation.isPending}
              >
                Simpan
              </Button>
              <Button onClick={() => navigate({ to: "/tenants" })}>
                Batal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
