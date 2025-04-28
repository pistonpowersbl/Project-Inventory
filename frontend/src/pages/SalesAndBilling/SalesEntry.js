import React, { useState, useEffect } from "react";
import axios from "axios";
import { DollarOutlined, ShoppingCartOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Table, Space } from "antd";

const DeleteConfirmationModal = ({ sale, onConfirm, onCancel }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%'
      }}>
        <h3 style={{ marginTop: 0 }}>Confirm Deletion</h3>
        <p>Are you sure you want to delete this sale record?</p>
        <ul style={{ paddingLeft: '20px' }}>
          <li><strong>Date:</strong> {new Date(sale.date).toLocaleDateString()}</li>
          <li><strong>Company:</strong> {sale.company_name}</li>
          <li><strong>Category:</strong> {sale.category}</li>
          <li><strong>Subcategory:</strong> {sale.subcategory}</li>
          <li><strong>Quantity:</strong> {sale.quantity}</li>
          <li><strong>Amount:</strong> ₹{parseFloat(sale.total_amount || 0).toFixed(2)}</li>
        </ul>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#e5e7eb',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
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

function SalesEntry() {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    code: "",
    hsn_code: "",
    company_name: "",
    category: "",
    subcategory: "",
    purchase_price: "",
    selling_price_mrp: "",
    quantity: "",
    discount: "0",
    total_amount: "0"
  });

  const [priceMode, setPriceMode] = useState("mrp");
  const [manualSellingPrice, setManualSellingPrice] = useState("");
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  // const [editingSale, setEditingSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState({
    type: "none",
    date: "",
    startDate: "",
    endDate: "",
    month: "",
    year: "",
    isApplied: false
  });

  const itemsPerPage = 20;

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/sales");
        setSales(response.data);
      } catch (error) {
        console.error("Failed to fetch sales:", error);
      }
    };
    fetchSales();
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/items");
        setItems(response.data);
      } catch (error) {
        console.error("Failed to fetch items:", error);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    const matchedItem = items.find(
      (item) => item.code?.toLowerCase() === formData.code.toLowerCase()
    );

    if (matchedItem) {
      setFormData((prev) => ({
        ...prev,
        hsn_code: matchedItem.hsn_code || "",
        company_name: matchedItem.company_name || "",
        category: matchedItem.category || "",
        subcategory: matchedItem.sub_category || "",
        purchase_price: matchedItem.purchase_price || "",
        selling_price_mrp: matchedItem.selling_price_mrp || matchedItem.selling_price || ""
      }));
      setManualSellingPrice("");
    }
  }, [formData.code, items]);

  useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.selling_price_mrp) || 0;
    const discountPercent = parseFloat(formData.discount) || 0;

    const subtotal = qty * price;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    setFormData(prev => ({
      ...prev,
      total_amount: total.toFixed(2)
    }));
  }, [formData.quantity, formData.selling_price_mrp, formData.discount]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-IN', {
  //     style: 'currency',
  //     currency: 'INR',
  //     minimumFractionDigits: 2
  //   }).format(amount).replace('₹', '₹ ');
  // };

  const getFilteredSales = () => {
    if (!filter.isApplied) return sales;

    return sales.filter(sale => {
      const saleDate = new Date(sale.date);
      
      switch (filter.type) {
        case 'date':
          return formatDate(sale.date) === formatDate(filter.date);
        case 'range':
          return new Date(filter.startDate) <= saleDate && saleDate <= new Date(filter.endDate);
        case 'month':
          return saleDate.getMonth() + 1 === parseInt(filter.month) && 
                 saleDate.getFullYear() === new Date().getFullYear();
        case 'year':
          return saleDate.getFullYear() === parseInt(filter.year);
        default:
          return true;
      }
    });
  };

  const filteredSales = getFilteredSales().filter((sale) => {
    const term = searchTerm.toLowerCase();
    return (
      (sale.code && sale.code.toLowerCase().includes(term)) ||
      (sale.hsn_code && sale.hsn_code.toLowerCase().includes(term)) ||
      sale.company_name.toLowerCase().includes(term) ||
      sale.category.toLowerCase().includes(term) ||
      sale.subcategory.toLowerCase().includes(term)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleFilterApply = () => {
    setFilter(prev => ({ ...prev, isApplied: true }));
    setCurrentPage(1);
  };

  const handleFilterReset = () => {
    setFilter({
      type: "none",
      date: "",
      startDate: "",
      endDate: "",
      month: "",
      year: "",
      isApplied: false
    });
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePriceModeChange = (mode) => {
    setPriceMode(mode);
    if (mode === "mrp") {
      const matchedItem = items.find(
        (item) => item.code?.toLowerCase() === formData.code.toLowerCase()
      );
      if (matchedItem) {
        setFormData(prev => ({
          ...prev,
          selling_price_mrp: matchedItem.selling_price_mrp || matchedItem.selling_price || ""
        }));
      }
    }
  };

  const handleManualPriceChange = (e) => {
    const value = e.target.value;
    setManualSellingPrice(value);
    setFormData(prev => ({
      ...prev,
      selling_price_mrp: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      const response = await axios.post("http://localhost:5000/api/sales", formData);
      
      // Update inventory
      setItems(prevItems => 
        prevItems.map(item => 
          item.code === formData.code ? 
          { ...item, quantity: item.quantity - parseFloat(formData.quantity) } 
          : item
        )
      );
      
      // Refresh sales data
      const salesResponse = await axios.get("http://localhost:5000/api/sales");
      setSales(salesResponse.data);
      setCurrentPage(1);
      
      alert(response.data.message || "✅ Sale recorded and inventory updated!");
      
      // Reset form
      handleResetForm();
      
      // Native form reset
      e.target.reset();
  
    } catch (error) {
      console.error("❌ Save failed:", error.response?.data || error.message);
      alert(error.response?.data?.error || "❌ Failed to save sale entry.");
    }
  };

  const handleResetForm = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      code: "",
      hsn_code: "",
      company_name: "",
      category: "",
      subcategory: "",
      purchase_price: "",
      selling_price_mrp: "",
      quantity: "",
      discount: "0",
      total_amount: "0"
    });
    setPriceMode("mrp");
    setManualSellingPrice("");
  };

  const handleDeleteSale = async (saleId) => {
    try {
      await axios.delete(`http://localhost:5000/api/sales/${saleId}`);
      const updatedSales = sales.filter(sale => sale.id !== saleId);
      setSales(updatedSales);
      setSaleToDelete(null);
      alert("✅ Sale deleted successfully!");
    } catch (error) {
      console.error("Failed to delete sale:", error);
      alert("❌ Failed to delete sale.");
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      align: 'center',
      render: (text) => formatDate(text)
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      align: 'center'
    },
    {
      title: 'HSN Code',
      dataIndex: 'hsn_code',
      key: 'hsn_code',
      align: 'center',
      render: (text) => text || '-'
    },
    {
      title: 'Company',
      dataIndex: 'company_name',
      key: 'company_name',
      align: 'center'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      align: 'center'
    },
    {
      title: 'Subcategory',
      dataIndex: 'subcategory',
      key: 'subcategory',
      align: 'center'
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchase_price',
      key: 'purchase_price',
      align: 'center',
      render: (text) => parseFloat(text || 0).toFixed(2)
    },
    {
      title: 'Sold Price',
      dataIndex: 'selling_price_mrp',
      key: 'selling_price_mrp',
      align: 'center',
      render: (text) => parseFloat(text || 0).toFixed(2)
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center'
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      align: 'center',
      render: (text) => `${parseFloat(text || 0).toFixed(2)}%`
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'center',
      render: (text) => parseFloat(text || 0).toFixed(2)
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => setSaleToDelete(record)}
          />
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
        Sales Entry
      </h2>

      {/* Sales Entry Form */}
      <form onSubmit={handleSubmit} style={{ 
        background: "#ffffff",
        padding: "15px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px"
      }}>
        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "12px", 
          marginBottom: "12px"
        }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Code</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>HSN Code</label>
            <input
              name="hsn_code"
              value={formData.hsn_code}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Company Name</label>
            <input
              name="company_name"
              value={formData.company_name}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Category</label>
            <input
              name="category"
              value={formData.category}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Subcategory</label>
            <input
              name="subcategory"
              value={formData.subcategory}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>
        </div>

        <div style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "12px", 
          marginBottom: "15px",
          alignItems: "flex-end"
        }}>
          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Purchase Price</label>
            <input
              name="purchase_price"
              value={formData.purchase_price}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Pricing</label>
            
            <div style={{ 
              display: "flex", 
              gap: "10px", 
              marginBottom: "6px",
              alignItems: "center"
            }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="priceMode"
                  checked={priceMode === "mrp"}
                  onChange={() => handlePriceModeChange("mrp")}
                />
                MRP
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13px" }}>
                <input
                  type="radio"
                  name="priceMode"
                  checked={priceMode === "selling"}
                  onChange={() => handlePriceModeChange("selling")}
                />
                Selling Price
              </label>
            </div>

            {priceMode === "mrp" ? (
              <input
                name="selling_price_mrp"
                value={formData.selling_price_mrp}
                readOnly
                style={{ 
                  width: "100%", 
                  padding: "6px", 
                  borderRadius: "4px", 
                  border: "1px solid #ced4da", 
                  background: "#f8f9fa",
                  fontSize: "13px",
                  height: "32px"
                }}
              />
            ) : (
              <input
                name="manual_selling_price"
                value={manualSellingPrice}
                onChange={handleManualPriceChange}
                type="number"
                min="0"
                step="0.01"
                style={{ 
                  width: "100%", 
                  padding: "6px", 
                  borderRadius: "4px", 
                  border: "1px solid #ced4da",
                  fontSize: "13px",
                  height: "32px"
                }}
              />
            )}
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Quantity</label>
            <input
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              type="number"
              min="1"
              step="1"
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Discount (%)</label>
            <input
              name="discount"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.discount}
              onChange={handleChange}
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da",
                fontSize: "13px",
                height: "32px"
              }}
            />
          </div>

          <div style={{ flex: "1 1 140px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "4px", 
              fontWeight: "500",
              color: "#495057",
              fontSize: "13px"
            }}>Total Amount</label>
            <input
              value={formData.total_amount}
              readOnly
              style={{ 
                width: "100%", 
                padding: "6px", 
                borderRadius: "4px", 
                border: "1px solid #ced4da", 
                background: "#f8f9fa",
                fontWeight: "600",
                fontSize: "13px",
                color: "#2c3e50",
                height: "32px"
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button
            type="submit"
            style={{
              padding: "8px 20px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              marginRight: "10px"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#218838";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#28a745";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
          >
            💾 Save Entry
          </button>
          <button
            type="button"
            onClick={handleResetForm}
            style={{
              padding: "8px 20px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "all 0.3s",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#5a6268";
              e.target.style.transform = "translateY(-2px)";
              e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.15)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#6c757d";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            }}
          >
            🔄 Reset Form
          </button>
        </div>
      </form>

      {/* Sales History Section */}
      <div style={{ marginTop: '40px' }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          Sales History
        </h2>

        {/* Summary Cards */}
        <div style={{ 
          marginBottom: 20, 
          display: 'flex', 
          gap: 16, 
          flexWrap: 'wrap' 
        }}>
          <div style={{ 
            flex: 1, 
            minWidth: 200, 
            ...subCardStyle
          }}>
            <p style={metricLabelStyle}>
              <DollarOutlined /> Total Sales
            </p>
            <p style={{ ...metricValueStyle, color: '#3f8600' }}>
              ₹{filteredSales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0).toFixed(2)}
            </p>
          </div>
          <div style={{ 
            flex: 1, 
            minWidth: 200, 
            ...subCardStyle
          }}>
            <p style={metricLabelStyle}>
              <ShoppingCartOutlined /> Items Sold
            </p>
            <p style={{ ...metricValueStyle, color: '#1890ff' }}>
              {filteredSales.reduce((sum, sale) => sum + parseFloat(sale.quantity || 0), 0)}
            </p>
          </div>
        </div>

        <input
          type="text"
          placeholder="Search by code, HSN code, company name, or category"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            marginBottom: "1rem",
            padding: "0.5rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            width: "100%"
          }}
        />

        {/* Filter Controls */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '1rem' }}>
          <select
            value={filter.type}
            onChange={(e) => setFilter({...filter, type: e.target.value})}
            style={{ 
              padding: "8px",
              borderRadius: "4px",
              border: "1px solid #ced4da"
            }}
          >
            <option value="none">No Filter</option>
            <option value="date">Specific Date</option>
            <option value="range">Date Range</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
          
          {filter.type === 'date' && (
            <input
              type="date"
              value={filter.date}
              onChange={(e) => setFilter({...filter, date: e.target.value})}
              style={{ 
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
            />
          )}
          
          {filter.type === 'range' && (
            <>
              <input
                type="date"
                value={filter.startDate}
                onChange={(e) => setFilter({...filter, startDate: e.target.value})}
                style={{ 
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da"
                }}
              />
              <span>to</span>
              <input
                type="date"
                value={filter.endDate}
                onChange={(e) => setFilter({...filter, endDate: e.target.value})}
                style={{ 
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ced4da"
                }}
              />
            </>
          )}
          
          {filter.type === 'month' && (
            <select
              value={filter.month}
              onChange={(e) => setFilter({...filter, month: e.target.value})}
              style={{ 
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
            >
              <option value="">Select Month</option>
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('default', {month: 'long'})}
                </option>
              ))}
            </select>
          )}
          
          {filter.type === 'year' && (
            <select
              value={filter.year}
              onChange={(e) => setFilter({...filter, year: e.target.value})}
              style={{ 
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ced4da"
              }}
            >
              <option value="">Select Year</option>
              {Array.from({length: 10}, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          )}
          
          <button
            onClick={handleFilterApply}
            style={{
              padding: "8px 16px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Apply
          </button>
          
          <button
            onClick={handleFilterReset}
            style={{
              padding: "8px 16px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>

        <Table
          columns={columns}
          dataSource={currentSales}
          rowKey="id"
          pagination={{
            current: currentPage,
            total: filteredSales.length,
            pageSize: itemsPerPage,
            onChange: handlePageChange,
            showSizeChanger: false,
            showQuickJumper: false,
            position: ['bottomCenter'],
            style: { marginTop: '16px' }
          }}
          style={{ marginTop: "10px" }}
          headerCellStyle={{
            backgroundColor: '#f0f2f5',
            fontWeight: 'bold',
            color: '#333'
          }}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {saleToDelete && (
        <DeleteConfirmationModal
          sale={saleToDelete}
          onConfirm={() => handleDeleteSale(saleToDelete.id)}
          onCancel={() => setSaleToDelete(null)}
        />
      )}
    </div>
  );
};

export default SalesEntry;