import { createFileRoute, redirect } from "@tanstack/react-router";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { Form, Input, Button, Card, Typography } from "antd";
import { useLogin } from "../hooks/use-auth";
import { authClient } from "../lib/auth-client";
import { useState } from "react";

const { Title, Text } = Typography;

export const Route = createFileRoute("/login")({
  component: LoginPage,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
});

function LoginPage() {
  const loginMutation = useLogin();
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string }) => {
    setError(null);
    try {
      await loginMutation.mutate(values);
    } catch (err: any) {
      setError(err?.message || "Invalid email or password");
    }
  };

  return (
    <div className="h-screen flex" style={{ backgroundColor: "#f8f5f0" }}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[90%] sm:max-w-md">
          <Card variant='outlined' style={{ boxShadow: "none" }}>
            <Title level={2} style={{ marginBottom: 24, textAlign: "center" }}>
              Login
            </Title>
            <Form
              name="login"
              initialValues={{ email: "", password: "" }}
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Please enter your email" },
                  { type: "email", message: "Please enter a valid email" },
                ]}
                label="Email"
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="email@example.com"
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[
                  { required: true, message: "Please enter your password" },
                  { min: 8, message: "Password must be at least 8 characters" },
                ]}
                label="Password"
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                />
              </Form.Item>

              {error && (
                <div style={{ marginBottom: 24, textAlign: "center" }}>
                  <Text type="danger">{error}</Text>
                </div>
              )}

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loginMutation.isPending}
                  style={{ height: 40, backgroundColor: "black" }}
                >
                  {loginMutation.isPending ? "Signing in..." : "Sign In"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>

      <div className="hidden lg:flex lg:flex-1 items-center justify-center m-2">
        <div className="w-full h-full rounded-3xl overflow-hidden shadow-lg" style={{ maxWidth: 800 }}>
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=1600&fit=crop"
            alt="Login background"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
}
