import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Table, DatePicker, Select, Button, Input, Form, message, Tag } from 'antd';
import { EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined, LineChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
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

const CashFlow = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    dateFilterType: 'all',
    subcategory: null,
    customDate: null,
    customRange: null,
    selectedMonth: null,
    selectedYear: null
  });

  // Fetch data from backend
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        subcategory: filters.subcategory,
        filterType: filters.dateFilterType,
        customDate: filters.customDate?.format('YYYY-MM-DD'),
        startDate: filters.customRange?.[0]?.format('YYYY-MM-DD'),
        endDate: filters.customRange?.[1]?.format('YYYY-MM-DD'),
        month: filters.selectedMonth,
        year: filters.selectedYear
      };
      const response = await axios.get("http://localhost:5000/api/cashflow", { params });
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

  // Calculate net cash flow
  const netCashFlow = data.reduce((sum, item) => {
    const amount = parseFloat(item.amount);
    return sum + (item.subcategory === 'in-flow' ? amount : -amount);
  }, 0);

  // Calculate total in-flow
  const totalInFlow = data.reduce((sum, item) => {
    return sum + (item.subcategory === 'in-flow' ? parseFloat(item.amount) : 0);
  }, 0);

  // Calculate total out-flow
  const totalOutFlow = data.reduce((sum, item) => {
    return sum + (item.subcategory === 'out-flow' ? parseFloat(item.amount) : 0);
  }, 0);

  // Form submit handler
  const onFinish = async (values) => {
    try {
      const payload = {
        ...values,
        date: values.date.format('YYYY-MM-DD')
      };

      if (editingId) {
        await axios.put(`http://localhost:5000/api/cashflow/${editingId}`, payload);
        message.success('Entry updated successfully');
      } else {
        await axios.post('http://localhost:5000/api/cashflow', payload);
        message.success('Entry added successfully');
      }
      form.resetFields();
      form.setFieldsValue({ date: dayjs() }); // Reset to today's date after submit
      setEditingId(null);
      fetchData();
    } catch (error) {
      message.error('Operation failed');
    }
  };

  // Edit handler
  const onEdit = (record) => {
    form.setFieldsValue({
      category: record.category,
      subcategory: record.subcategory,
      amount: Math.abs(record.amount),
      date: dayjs(record.date)
    });
    setEditingId(record.id);
  };

  // Delete handler
  const onDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/cashflow/${id}`);
      message.success('Entry deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Delete failed');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category'
    },
    {
      title: 'Subcategory',
      dataIndex: 'subcategory',
      key: 'subcategory',
      render: (subcategory) => (
        <Tag color={subcategory === 'in-flow' ? 'green' : 'red'}>
          {subcategory.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <span style={{ color: record.subcategory === 'in-flow' ? 'green' : 'red' }}>
          {record.subcategory === 'out-flow' ? '-' : ''}
          {Math.abs(amount).toLocaleString('en-IN')}
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
      <h1>Cash Flow Statement</h1>

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
            <LineChartOutlined /> Total Net Cash Flow
          </p>
          <p style={{ 
            ...metricValueStyle, 
            color: netCashFlow >= 0 ? '#3f8600' : '#cf1322'
          }}>
            {netCashFlow >= 0 ? '₹' : '-₹'}{Math.abs(netCashFlow).toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: 200, 
          ...subCardStyle
        }}>
          <p style={metricLabelStyle}>
            <ArrowDownOutlined /> Total In-Flow
          </p>
          <p style={{ ...metricValueStyle, color: '#3f8600' }}>
            ₹{totalInFlow.toLocaleString('en-IN')}
          </p>
        </div>
        <div style={{ 
          flex: 1, 
          minWidth: 200, 
          ...subCardStyle
        }}>
          <p style={metricLabelStyle}>
            <ArrowUpOutlined /> Total Out-Flow
          </p>
          <p style={{ ...metricValueStyle, color: '#cf1322' }}>
            ₹{totalOutFlow.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Select
          defaultValue="all"
          onChange={(value) => setFilters({...filters, dateFilterType: value})}
          style={{ width: 120 }}
        >
          <Option value="all">All Dates</Option>
          <Option value="single">Specific Date</Option>
          <Option value="range">Date Range</Option>
          <Option value="month">Month</Option>
          <Option value="year">Year</Option>
        </Select>

        {filters.dateFilterType === 'single' && (
          <DatePicker 
            onChange={(date) => setFilters({...filters, customDate: date})}
            style={{ width: 150 }}
          />
        )}

        {filters.dateFilterType === 'range' && (
          <RangePicker
            onChange={(range) => setFilters({...filters, customRange: range})}
            style={{ width: 250 }}
          />
        )}

        {filters.dateFilterType === 'month' && (
          <Select
            placeholder="Select month"
            onChange={(month) => setFilters({...filters, selectedMonth: month})}
            style={{ width: 120 }}
          >
            {Array.from({length: 12}, (_, i) => (
              <Option key={i+1} value={i+1}>
                {dayjs().month(i).format('MMMM')}
              </Option>
            ))}
          </Select>
        )}

        {filters.dateFilterType === 'year' && (
          <Select
            placeholder="Select year"
            onChange={(year) => setFilters({...filters, selectedYear: year})}
            style={{ width: 120 }}
          >
            {Array.from({length: 5}, (_, i) => {
              const year = dayjs().year() - 2 + i;
              return <Option key={year} value={year}>{year}</Option>;
            })}
          </Select>
        )}

        <Select
          placeholder="Filter by type"
          style={{ width: 150 }}
          allowClear
          onChange={(value) => setFilters({...filters, subcategory: value})}
        >
          <Option value="in-flow">In-flow</Option>
          <Option value="out-flow">Out-flow</Option>
        </Select>

        <Button onClick={() => {
          setFilters({
            dateFilterType: 'all',
            subcategory: null,
            customDate: null,
            customRange: null,
            selectedMonth: null,
            selectedYear: null
          });
        }}>Reset</Button>
      </div>

      {/* Entry Form */}
      <Form
        form={form}
        layout="inline"
        onFinish={onFinish}
        initialValues={{ date: dayjs() }}
        style={{ marginBottom: 20 }}
      >
        <Form.Item
          name="date"
          label="Date"
        >
          <DatePicker 
            style={{ width: 150 }}
            format="DD/MM/YYYY"
          />
        </Form.Item>
        <Form.Item
          name="category"
          rules={[{ required: true, message: 'Please enter category' }]}
        >
          <Input placeholder="Category" />
        </Form.Item>
        <Form.Item
          name="subcategory"
          rules={[{ required: true, message: 'Please select type' }]}
        >
          <Select placeholder="Type" style={{ width: 120 }}>
            <Option value="in-flow">In-flow</Option>
            <Option value="out-flow">Out-flow</Option>
          </Select>
        </Form.Item>
        <Form.Item
          name="amount"
          rules={[{ required: true, message: 'Please enter amount' }]}
        >
          <Input type="number" placeholder="Amount" />
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

export default CashFlow;