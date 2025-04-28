import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, DatePicker, Select, Button, Input, Form, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowDownOutlined, ArrowUpOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

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

const ProfitAndLoss = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    month: null, // Format: 'YYYY-MM'
    type: null // 'Income' or 'Expense'
  });

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        month: filters.month,
        type: filters.type
      };
      console.log("API Request Params:", params);
      const response = await axios.get("http://localhost:5000/api/profit-loss", { params });
      console.log("API Response Data:", response.data);
      setData(response.data);
    } catch (error) {
      message.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debug filter changes - Add this right after the above useEffect
useEffect(() => {
  console.log("Current filters:", filters);
}, [filters]);

  // Calculate net total
  const netTotal = data.reduce((sum, item) => {
    const value = item.type === 'Income' ? item.amount : -item.amount;
    return sum + Number(value);
  }, 0);

  // Calculate total income
  const totalIncome = data.reduce((sum, item) => {
    return sum + (item.type === 'Income' ? Number(item.amount) : 0);
  }, 0);

  // Calculate total expense
  const totalExpense = data.reduce((sum, item) => {
    return sum + (item.type === 'Expense' ? Number(item.amount) : 0);
  }, 0);

  // Form submit handler
  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        month: values.month.format('YYYY-MM')
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/profit-loss/${editingId}`, payload);
        message.success('Entry updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/profit-loss', payload);
        message.success('Entry added successfully');
      }
      
      form.resetFields();
      setEditingId(null);
      fetchData();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  // Edit handler
  const onEdit = (record) => {
    form.setFieldsValue({
      month: dayjs(record.month + '-01'), // Convert 'YYYY-MM' to dayjs object
      category: record.category,
      type: record.type,
      amount: Math.abs(record.amount)
    });
    setEditingId(record.id);
  };

  // Delete handler
  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/profit-loss/${id}`);
      message.success('Entry deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Delete failed');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
      render: (month) => dayjs(month + '-01').format('MMM YYYY')
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'Income' ? 'green' : 'red'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ color: record.type === 'Income' ? 'green' : 'red' }}>
          {record.type === 'Income' ? '+' : '-'}
          {amount.toLocaleString('en-IN')}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <div>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => onEdit(record)}
          />
          <Button 
            type="link" 
            icon={<DeleteOutlined />} 
            onClick={() => onDelete(record.id)}
            danger
          />
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>📊 Profit & Loss Statement</h1>

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
            <LineChartOutlined /> Net Total
          </p>
          <p style={{ 
            ...metricValueStyle, 
            color: netTotal >= 0 ? '#3f8600' : '#cf1322'
          }}>
            {netTotal >= 0 ? '₹' : '-₹'}{Math.abs(netTotal).toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: 200, 
          ...subCardStyle
        }}>
          <p style={metricLabelStyle}>
            <ArrowDownOutlined /> Total Income
          </p>
          <p style={{ ...metricValueStyle, color: '#3f8600' }}>
            ₹{totalIncome.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: 200, 
          ...subCardStyle
        }}>
          <p style={metricLabelStyle}>
            <ArrowUpOutlined /> Total Expense
          </p>
          <p style={{ ...metricValueStyle, color: '#cf1322' }}>
            ₹{totalExpense.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <DatePicker 
          picker="month" 
          format="MMM YYYY"
          placeholder="Select month"
          onChange={(date) => setFilters({...filters, month: date ? date.format('YYYY-MM') : null})}
        />
        <Select
          placeholder="Filter by type"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({...filters, type: value})}
        >
          <Option value="Income">Income</Option>
          <Option value="Expense">Expense</Option>
        </Select>
        <Button 
          onClick={() => {
            setFilters({ month: null, type: null });
          }}
        >
          Reset Filters
        </Button>
      </div>

      {/* Entry Form */}
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        style={{ marginBottom: 20 }}
      >
        <Form.Item
          name="month"
          rules={[{ required: true, message: 'Please select month' }]}
        >
          <DatePicker 
            picker="month" 
            format="MMM YYYY"
            placeholder="Month"
            style={{ width: 150 }}
          />
        </Form.Item>
        <Form.Item
          name="category"
          rules={[{ required: true, message: 'Please enter category' }]}
        >
          <Input placeholder="Category" />
        </Form.Item>
        <Form.Item
          name="type"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select placeholder="Type" style={{ width: 120 }}>
            <Option value="Income">Income</Option>
            <Option value="Expense">Expense</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          rules={[{ 
            required: true, 
            message: 'Please enter amount',
            validator: (_, value) => 
              value > 0 ? Promise.resolve() : Promise.reject('Amount must be positive')
          }]}
        >
          <Input type="number" placeholder="Amount" min={0} step={0.01} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {editingId ? 'Update' : 'Add'} Entry
          </Button>
          {editingId && (
            <Button style={{ marginLeft: 8 }} onClick={() => {
              form.resetFields();
              setEditingId(null);
            }}>
              Cancel
            </Button>
          )}
        </Form.Item>
      </Form>

      {/* Data Table */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        bordered
      />
    </div>
  );
};

export default ProfitAndLoss;