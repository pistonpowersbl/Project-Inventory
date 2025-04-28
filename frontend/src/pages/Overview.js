import React, { useEffect, useState } from "react";
import { Row, Col, Card } from "antd";
import { 
  ShoppingOutlined, 
  DollarOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  InboxOutlined,
  ShoppingCartOutlined,
  MoneyCollectOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import axios from "axios";

const cardHeaderStyle = (backgroundColor) => ({
  backgroundColor,
  color: "white",
  fontWeight: "bold",
  textAlign: "center",
  fontSize: "18px",
  padding: "12px",
  borderTopLeftRadius: "8px",
  borderTopRightRadius: "8px",
});

const mainCardStyle = {
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  minHeight: "240px",
  marginBottom: "16px",
  transition: "all 0.3s ease",
  cursor: "pointer",
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
  }
};

const subCardStyle = {
  marginBottom: "8px",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  padding: "20px",
  height: "100%",
  transition: "all 0.3s ease",
  cursor: "pointer",
  background: "white",
  ":hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
  }
};

const metricLabelStyle = {
  fontSize: "16px",
  color: "#666",
  margin: 0,
  display: "flex",
  alignItems: "center",
  gap: "8px"
};

const metricValueStyle = {
  fontSize: "28px",
  fontWeight: "bold",
  margin: "12px 0 0 0",
  color: "#333"
};

const Overview = () => {
  const [inventoryData, setInventoryData] = useState({ productsCount: 0, totalQuantity: 0 });
  const [salesData, setSalesData] = useState({ totalSales: 0, itemsSold: 0 });
  const [cashFlowData, setCashFlowData] = useState({ 
    netCashFlow: 0,
    totalInFlow: 0,
    totalOutFlow: 0
  });
  const [profitLossData, setProfitLossData] = useState({
    netTotal: 0,
    totalIncome: 0,
    totalExpense: 0
  });

  const fetchInventoryData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/items");
      const items = response.data;
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      const productsCount = items.length;
      setInventoryData({ productsCount, totalQuantity });
    } catch (error) {
      console.error("Error fetching inventory data:", error);
    }
  };

  const fetchSalesData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/sales");
      const sales = response.data;
      const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
      const itemsSold = sales.reduce((sum, sale) => sum + parseFloat(sale.quantity || 0), 0);
      setSalesData({ totalSales, itemsSold });
    } catch (error) {
      console.error("Error fetching sales data:", error);
    }
  };

  const fetchCashFlowData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/cashflow");
      const cashFlowData = response.data;
      const totalInFlow = cashFlowData
        .filter(item => item.subcategory === "in-flow")
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      
      const totalOutFlow = cashFlowData
        .filter(item => item.subcategory === "out-flow")
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      
      const netCashFlow = totalInFlow - totalOutFlow;
      
      setCashFlowData({ netCashFlow, totalInFlow, totalOutFlow });
    } catch (error) {
      console.error("Error fetching cash flow data:", error);
    }
  };

  const fetchProfitLossData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/profit-loss");
      const profitLossData = response.data;
      const totalIncome = profitLossData
        .filter(item => item.type === "Income")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      
      const totalExpense = profitLossData
        .filter(item => item.type === "Expense")
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);
      
      const netTotal = totalIncome - totalExpense;
      
      setProfitLossData({ netTotal, totalIncome, totalExpense });
    } catch (error) {
      console.error("Error fetching profit & loss data:", error);
    }
  };

  useEffect(() => {
    // Initial data fetch
    fetchInventoryData();
    fetchSalesData();
    fetchCashFlowData();
    fetchProfitLossData();

    // Set up event source for real-time updates
    const eventSource = new EventSource('http://localhost:5000/api/events');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'inventory':
          fetchInventoryData();
          break;
        case 'sales':
          fetchSalesData();
          break;
        case 'cashflow':
          fetchCashFlowData();
          break;
        case 'profitloss':
          fetchProfitLossData();
          break;
        default:
          break;
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <h1 style={{ 
        textAlign: "center", 
        marginBottom: "24px", 
        fontWeight: "bold", 
        color: "#333",
        fontSize: "28px"
      }}>
        Overview Dashboard
      </h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={12}>
          <Card
            title={<div style={cardHeaderStyle("#e74c3c")}>Inventory Management</div>}
            bordered={false}
            style={mainCardStyle}
            bodyStyle={{ padding: "16px" }}
          >
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ShoppingOutlined /> Products
                  </p>
                  <p style={metricValueStyle}>
                    {inventoryData.productsCount}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <InboxOutlined /> Total Items in Stock
                  </p>
                  <p style={metricValueStyle}>
                    {inventoryData.totalQuantity}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card
            title={<div style={cardHeaderStyle("#f4d03f")}>Sales Entry</div>}
            bordered={false}
            style={mainCardStyle}
            bodyStyle={{ padding: "16px" }}
          >
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <DollarOutlined /> Total Sales
                  </p>
                  <p style={metricValueStyle}>
                    ₹{salesData.totalSales.toLocaleString()}
                  </p>
                </div>
              </Col>
              <Col span={12}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ShoppingCartOutlined /> Items Sold
                  </p>
                  <p style={metricValueStyle}>
                    {salesData.itemsSold}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card
            title={<div style={cardHeaderStyle("#3498db")}>Cash Flow</div>}
            bordered={false}
            style={mainCardStyle}
            bodyStyle={{ padding: "16px" }}
          >
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <MoneyCollectOutlined /> Total Net Cash Flow
                  </p>
                  <p style={{ 
                    ...metricValueStyle,
                    color: cashFlowData.netCashFlow >= 0 ? "#52c41a" : "#f5222d"
                  }}>
                    {cashFlowData.netCashFlow < 0 ? `-₹${Math.abs(cashFlowData.netCashFlow).toLocaleString()}` : `₹${cashFlowData.netCashFlow.toLocaleString()}`}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ArrowDownOutlined style={{ color: "#52c41a" }} /> Total In-Flow
                  </p>
                  <p style={{ ...metricValueStyle, color: "#52c41a" }}>
                    ₹{cashFlowData.totalInFlow.toLocaleString()}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ArrowUpOutlined style={{ color: "#f5222d" }} /> Total Out-Flow
                  </p>
                  <p style={{ ...metricValueStyle, color: "#f5222d" }}>
                    ₹{cashFlowData.totalOutFlow.toLocaleString()}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={12}>
          <Card
            title={<div style={cardHeaderStyle("#27ae60")}>Profit & Loss</div>}
            bordered={false}
            style={mainCardStyle}
            bodyStyle={{ padding: "16px" }}
          >
            <Row gutter={[8, 8]}>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <LineChartOutlined /> Net Total
                  </p>
                  <p style={{ 
                    ...metricValueStyle,
                    color: profitLossData.netTotal >= 0 ? "#52c41a" : "#f5222d"
                  }}>
                    {profitLossData.netTotal < 0 ? `-₹${Math.abs(profitLossData.netTotal).toLocaleString()}` : `₹${profitLossData.netTotal.toLocaleString()}`}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ArrowDownOutlined style={{ color: "#52c41a" }} /> Total Income
                  </p>
                  <p style={{ ...metricValueStyle, color: "#52c41a" }}>
                    ₹{profitLossData.totalIncome.toLocaleString()}
                  </p>
                </div>
              </Col>
              <Col span={8}>
                <div style={subCardStyle}>
                  <p style={metricLabelStyle}>
                    <ArrowUpOutlined style={{ color: "#f5222d" }} /> Total Expense
                  </p>
                  <p style={{ ...metricValueStyle, color: "#f5222d" }}>
                    ₹{profitLossData.totalExpense.toLocaleString()}
                  </p>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
