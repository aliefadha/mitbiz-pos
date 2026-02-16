import { Typography, Spin, Card, Button, Descriptions } from "antd";
import { useParams, useNavigate } from "@tanstack/react-router";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { outletsApi } from "@/lib/api/outlets";

const { Title } = Typography;

export function OutletDetailPage() {
  const { id, outletId } = useParams({ from: "/_protected/tenants/$id/outlets/$outletId" });
  const navigate = useNavigate();

  const { data: outlet, isLoading } = useQuery({
    queryKey: ["outlet", outletId],
    queryFn: () => outletsApi.getById(Number(outletId)),
  });

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!outlet) {
    return <div>Outlet not found</div>;
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
              Outlet Details
            </Title>
          </div>
        }
        style={{ marginBottom: 24 }}
      >
        <Descriptions column={2}>
          <Descriptions.Item label="Kode">{outlet.kode}</Descriptions.Item>
          <Descriptions.Item label="Nama">{outlet.name}</Descriptions.Item>
          <Descriptions.Item label="Alamat">{outlet.alamat || "-"}</Descriptions.Item>
          <Descriptions.Item label="No. HP">{outlet.noHp || "-"}</Descriptions.Item>
          <Descriptions.Item label="Dibuat">
            {new Date(outlet.createdAt).toLocaleString("id-ID")}
          </Descriptions.Item>
          {outlet.updatedAt && (
            <Descriptions.Item label="Diperbarui">
              {new Date(outlet.updatedAt).toLocaleString("id-ID")}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>
    </div>
  );
}
