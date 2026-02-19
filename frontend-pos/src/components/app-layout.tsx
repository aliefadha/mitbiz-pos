import { Layout, Menu, Avatar, Dropdown, Typography } from "antd";
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  TeamOutlined,
  AccountBookOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/auth-context";
import { useState } from "react";
import { useLogout } from "@/hooks/use-auth";
import { type Role } from "@/lib/rbac";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuConfig = [
  {
    key: "/dashboard",
    icon: <DashboardOutlined />,
    label: "Dashboard",
    roles: ["admin", "owner", "cashier"],
  },
  {
    key: "/tenants",
    icon: <TeamOutlined />,
    label: "Tenants",
    roles: ["admin", "owner"],
  },
  {
    key: "/account",
    icon: <AccountBookOutlined />,
    label: "Account",
    roles: ["admin"],
  },
];

const bottomItems = [
  {
    key: "/settings",
    icon: <SettingOutlined />,
    label: "Settings",
    roles: ["admin", "owner"],
  },
];

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const role = (user?.role as Role) || "cashier";

  const menuItems = menuConfig.filter((item) => item.roles.includes(role));
  const filteredBottomItems = bottomItems.filter((item) =>
    item.roles.includes(role),
  );

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate({ to: key });
  };

  const userMenuItems = [
    {
      key: "account",
      icon: <UserOutlined />,
      label: "Account",
    },
    {
      key: "billing",
      icon: <BellOutlined />,
      label: "Notifications",
    },
    {
      type: "divider" as const,
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Log out",
      danger: true,
      onClick: () => logoutMutation.mutate(),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        width={250}
        collapsed={collapsed}
        collapsedWidth={80}
        trigger={null}
        style={{
          background: "#fff",
          borderRight: "1px solid #f0f0f0",
          transition: "all 0.2s",
        }}
      >
        <div
          style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            padding: collapsed ? "0 12px" : "0 16px",
            borderBottom: "1px solid #f0f0f0",
            justifyContent: collapsed ? "center" : "space-between",
          }}
        >
          {!collapsed && (
            <div className="mx-auto">
              <img src="/mitbiz-pos.png" className="w-32 mx-auto" />
            </div>
          )}
          {collapsed && (
            <HomeOutlined style={{ fontSize: 20, color: "#1890ff" }} />
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ borderRight: 0, marginTop: 8 }}
          inlineCollapsed={collapsed}
        />
        <Menu
          mode="inline"
          selectedKeys={
            location.pathname.startsWith("/settings") ? ["/settings"] : []
          }
          onClick={handleMenuClick}
          items={filteredBottomItems}
          style={{
            borderRight: 0,
            marginTop: "auto",
            borderTop: "1px solid #f0f0f0",
          }}
          inlineCollapsed={collapsed}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid #f0f0f0",
            height: 64,
          }}
        >
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              cursor: "pointer",
              padding: 8,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            {collapsed ? (
              <MenuUnfoldOutlined style={{ fontSize: 18 }} />
            ) : (
              <MenuFoldOutlined style={{ fontSize: 18 }} />
            )}
          </div>
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Badge count={0}>
              <BellOutlined style={{ fontSize: 18, cursor: "pointer" }} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <Avatar icon={<UserOutlined />} />
                <div style={{ lineHeight: 1.2 }}>
                  <Text strong style={{ display: "block", fontSize: 14 }}>
                    {user?.name || "User"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {user?.email || ""}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 6,
            background: "#fff",
            padding: 12,
            borderRadius: 8,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

function Badge({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  return (
    <span style={{ position: "relative", display: "inline-block" }}>
      {children}
      {count > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            background: "#ff4d4f",
            color: "#fff",
            borderRadius: "50%",
            minWidth: 16,
            height: 16,
            fontSize: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
}
