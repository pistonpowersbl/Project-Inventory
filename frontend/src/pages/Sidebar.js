import React from 'react';
import { Layout, Menu, Button } from 'antd';
import { PieChartOutlined, DollarOutlined, LineChartOutlined, FundOutlined, AppstoreOutlined, UserOutlined, FileTextOutlined, BankOutlined } from '@ant-design/icons';
import { Link, Outlet, useNavigate } from 'react-router-dom';
// import { CurrencyRupee } from '@mui/icons-material';

const { Header, Content, Sider } = Layout;

const Dashboard = () => {
    const navigate = useNavigate();
    const userName = localStorage.getItem("userName");
  
    const handleLogout = () => {
      localStorage.removeItem("token");
      localStorage.removeItem("userName");
      navigate("/login");
    };
  
    return (
      <Layout style={{ minHeight: "100vh" }}>
        {/* Fixed Sidebar */}
        <Sider 
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1
          }}
        >
          <div className="logo" style={{
            textAlign: "center",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "white"
          }}>
            <img
              src="/logo.jpg"
              alt="Logo"
              style={{
                width: "100%",
                maxWidth: "168px",
                maxHeight: "60px",
                objectFit: "contain",
                display: "block",
                margin: -5,
                padding: 0
              }}
            />
          </div>
          <Menu theme="dark" mode="inline">
            <Menu.Item key="1" icon={<PieChartOutlined />}>
              <Link to="/">Overview</Link>
            </Menu.Item>
            <Menu.Item key="2" icon={<AppstoreOutlined />}>
              <Link to="/inventory-management">Inventory</Link>
            </Menu.Item>
            <Menu.Item key="3" icon={<DollarOutlined />}>
              <Link to="/sales-entry">Sales Entry</Link>
            </Menu.Item>
            <Menu.Item key="4" icon={<LineChartOutlined />}>
              <Link to="/cash-flow">Cash Flow</Link>
            </Menu.Item>
            <Menu.Item key="5" icon={<FundOutlined />}>
              <Link to="/profit-and-loss">Profit & Loss</Link>
            </Menu.Item>
            <Menu.Item key="7" icon={<FileTextOutlined />}>
  <Link to="/gst-invoice">GST Invoice</Link>
</Menu.Item> 
<Menu.Item key="8" icon={<BankOutlined />}>
  <Link to="/cash-credit-account">Cash Credit Account</Link>
</Menu.Item>
            <Menu.Item key="6" icon={<UserOutlined />}>
              <Link to="/users">Users</Link>
            </Menu.Item>
          </Menu>
        </Sider>

        {/* Main Layout with fixed header and scrolling content */}
        <Layout style={{ 
          marginLeft: 200, // Matches sidebar width
          marginTop: 64   // Matches header height
        }}>
          {/* Fixed Header */}
          <Header style={{ 
            background: "#001529", 
            padding: "0 16px", 
            display: "flex", 
            justifyContent: "flex-end", 
            alignItems: "center",
            position: 'fixed',
            top: 0,
            right: 0,
            left: 200, // Sidebar width
            zIndex: 1,
            height: 64,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontWeight: "bold", color: 'rgba(255, 255, 255, 0.65)' }}> {userName || "Guest"}</span>
              <Button type="primary" danger onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </Header>

          {/* Scrollable Content */}
          <Content style={{ 
            margin: "16px",
            marginTop: 16, // Changed from 80px to 16px
            overflow: 'auto'
          }}>
            <div style={{ 
              padding: 24, 
              background: "#fff", 
              minHeight: "calc(100vh - 112px)" // Adjust based on your needs
            }}>
              <Outlet />
            </div>
          </Content>
        </Layout>
      </Layout>
    );
};
  
export default Dashboard;