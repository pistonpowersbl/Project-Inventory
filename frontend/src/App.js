import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Sidebar";
import "./App.css";
import AddItemModal from "./AddItemModal";
import ItemList from "./ItemList";
import EditItemModal from "./EditItemModal";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Overview from "./pages/Overview";
import SalesEntry from "./pages/SalesAndBilling/SalesEntry";
import CashFlow from "./pages/CashFlow";
import ProfitAndLoss from "./pages/ProfitAndLoss";
import Register from "./pages/Register";
import Login from "./pages/Login";
import PrivateRoute from "./components/PrivateRoute";
import Users from "./pages/Users";
import GSTInvoice from "./pages/GSTInvoice";
import CashCreditAccount from "./pages/CashCreditAccount/CashCreditAccount"; // Import the new component
import { InventoryProvider, useInventory } from "./context/InventoryProvider";
import { Row, Col } from "antd";
import { ShoppingOutlined, InboxOutlined } from "@ant-design/icons";

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

// InventoryManagementPage now uses context for inventory data
function InventoryManagementPage() {
  const {
    items,
    loading,
    handleItemAdded,
    handleDeleteItem,
    handleUpdateItem,
  } = useInventory();

  // Local state for modals and selected item
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div style={{ padding: "24px", background: "white", minHeight: "100vh" }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: "28px",
          fontWeight: "bold",
          color: "#333"
        }}>
          Inventory Management
        </h1>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            height: "36px"
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Add New Item
        </button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={12}>
          <div style={subCardStyle}>
            <p style={metricLabelStyle}>
              <ShoppingOutlined /> Products
            </p>
            <p style={{ ...metricValueStyle, color: "#52c41a" }}>
              {items.length}
            </p>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={12}>
          <div style={subCardStyle}>
            <p style={metricLabelStyle}>
              <InboxOutlined /> Total Items in Stock
            </p>
            <p style={{ ...metricValueStyle, color: "#1890ff" }}>
              {totalQuantity}
            </p>
          </div>
        </Col>
      </Row>

      <ItemList
        items={items}
        loading={loading}
        onDelete={handleDeleteItem}
        onUpdate={handleUpdateItem}
        onEdit={(item) => {
          setSelectedItem(item);
          setShowEditModal(true);
        }}
      />

      {showEditModal && selectedItem && (
        <EditItemModal
          item={selectedItem}
          onClose={() => {
            setShowEditModal(false);
            setSelectedItem(null);
          }}
          onUpdate={handleUpdateItem}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onItemAdded={handleItemAdded}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <InventoryProvider>
      <Router>
        <Routes>
          {/* Public Route for Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<PrivateRoute><Overview /></PrivateRoute>} />
            <Route path="inventory-management" element={<PrivateRoute><InventoryManagementPage /></PrivateRoute>} />
            <Route path="sales-entry" element={<PrivateRoute><SalesEntry /></PrivateRoute>} />
            <Route path="cash-flow" element={<PrivateRoute><CashFlow /></PrivateRoute>} />
            <Route path="profit-and-loss" element={<PrivateRoute><ProfitAndLoss /></PrivateRoute>} />
            <Route path="cash-credit-account" element={<PrivateRoute><CashCreditAccount /></PrivateRoute>} />
            <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
            <Route path="/gst-invoice" element={<PrivateRoute><GSTInvoice /></PrivateRoute>} />
            <Route path="/register" element={<PrivateRoute><Register /></PrivateRoute>} />
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </InventoryProvider>
  );
}

export default App;