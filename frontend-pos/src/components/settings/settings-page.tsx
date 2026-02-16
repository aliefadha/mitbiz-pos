import { Typography, Card, Form, Input, Button, Avatar, Space, Spin, message } from "antd";
import { UserOutlined, UploadOutlined } from "@ant-design/icons";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usersApi } from "@/lib/api/users";

const { Title, Text } = Typography;

export function SettingsPage() {
  const [form] = Form.useForm();

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getProfile(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { name?: string; image?: string }) =>
      usersApi.updateProfile(data),
    onSuccess: () => {
      message.success("Profile updated successfully");
      refetch();
    },
    onError: (error: Error) => {
      message.error(error.message || "Failed to update profile");
    },
  });

  if (profile) {
    form.setFieldsValue({
      name: profile.name,
      email: profile.email,
    });
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          Settings
        </Title>
        <Text type="secondary">Manage your account settings</Text>
      </div>

      <Spin spinning={isLoading}>
        <Card>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Avatar
              size={80}
              src={profile?.image}
              icon={<UserOutlined />}
              style={{ marginBottom: 12 }}
            />
            <div>
              <Button icon={<UploadOutlined />} size="small">
                Change Photo
              </Button>
            </div>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => {
              const { email, ...updateData } = values;
              updateMutation.mutate(updateData);
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Name is required" }]}
            >
              <Input placeholder="Enter your name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input disabled />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateMutation.isPending}
                >
                  Save Changes
                </Button>
                <Button onClick={() => form.resetFields()}>Cancel</Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Spin>
    </div>
  );
}
