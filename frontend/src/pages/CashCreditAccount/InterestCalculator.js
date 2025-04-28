import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Divider, Statistic, DatePicker, Table, message, Spin, Select, Popconfirm } from 'antd';
import { FaRupeeSign, FaSave } from 'react-icons/fa';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const { Option } = Select;

const InterestCalculator = () => {
  // State for inputs
  const [principal, setPrincipal] = useState('');
  const [rate, setRate] = useState('');
  const [startDate, setStartDate] = useState(dayjs());
  const [days, setDays] = useState(30);
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [deletingId, setDeletingId] = useState(null);

  // Calculate interests
  const dailyInterest = principal && rate ? (principal * (rate / 100)) / 365 : 0;
  const monthlyInterest = dailyInterest * days;
  const totalMonthlyInterest = calculations
    .filter(calc => dayjs(calc.date).format('YYYY-MM') === selectedMonth)
    .reduce((sum, calc) => sum + Number(calc.calculated_interest), 0);

  // Month options for dropdown
  const monthOptions = [];
  for (let i = 0; i < 12; i++) {
    const month = dayjs().subtract(i, 'month');
    monthOptions.push(
      <Option key={month.format('YYYY-MM')} value={month.format('YYYY-MM')}>
        {month.format('MMMM YYYY')}
      </Option>
    );
  }

  // Fetch calculations on mount
  useEffect(() => {
    const fetchCalculations = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/calculations');
        setCalculations(response.data);
      } catch (err) {
        console.error('Error loading calculations:', err);
        message.error('Failed to load calculations');
      } finally {
        setLoading(false);
      }
    };
    fetchCalculations();
  }, []);

  // Save calculation
  const handleSave = async () => {
    if (!principal || !rate || !days) {
      message.warning('Please fill all fields');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('http://localhost:5000/api/calculations', {
        principal: Number(principal),
        interest_rate: Number(rate),
        days: Number(days),
        date: startDate.format('YYYY-MM-DD')
      });
      
      setCalculations([response.data, ...calculations]);
      message.success('Calculation saved!');
      setPrincipal('');
      setRate('');
    } catch (err) {
      console.error('Save error:', err);
      message.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Delete calculation
  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await axios.delete(`http://localhost:5000/api/calculations/${id}`);
      setCalculations(calculations.filter(calc => calc.id !== id));
      message.success('Calculation deleted successfully');
    } catch (err) {
      console.error('Delete error:', err);
      message.error(err.response?.data?.error || 'Failed to delete calculation');
    } finally {
      setDeletingId(null);
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('DD MMM YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Principal (₹)',
      dataIndex: 'principal',
      key: 'principal',
      render: (val) => val?.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      sorter: (a, b) => a.principal - b.principal,
    },
    {
      title: 'Rate (%)',
      dataIndex: 'interest_rate',
      key: 'rate',
      sorter: (a, b) => a.interest_rate - b.interest_rate,
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      sorter: (a, b) => a.days - b.days,
    },
    {
      title: 'Interest (₹)',
      dataIndex: 'calculated_interest',
      key: 'interest',
      render: (val) => val?.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      sorter: (a, b) => a.calculated_interest - b.calculated_interest,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this calculation?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            danger 
            icon={<DeleteOutlined />}
            loading={deletingId === record.id}
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card 
      title="Cash Credit Interest Calculator" 
      bordered={false}
      extra={<Spin spinning={loading} />}
    >
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Outstanding Balance (₹)</label>
          <Input
            prefix={<FaRupeeSign />}
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            placeholder="e.g., 100000"
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Interest Rate (% p.a.)</label>
          <Input
            type="number"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="e.g., 9.5"
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Start Date</label>
          <DatePicker
            value={startDate}
            onChange={(date) => setStartDate(date)}
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
          />
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label>Duration (Days)</label>
          <Input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            placeholder="e.g., 30"
          />
        </div>
      </div>

      <Divider />

      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <Card bordered={false}>
          <Statistic
            title="Daily Interest"
            value={dailyInterest.toFixed(2)}
            prefix={<FaRupeeSign />}
          />
        </Card>
        <Card bordered={false}>
          <Statistic
            title={`Interest for ${days} days`}
            value={monthlyInterest.toFixed(2)}
            prefix={<FaRupeeSign />}
          />
        </Card>
        <Card bordered={false}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Select
              value={selectedMonth}
              onChange={setSelectedMonth}
              style={{ width: 150 }}
            >
              {monthOptions}
            </Select>
          </div>
          <Statistic
            title="Total Monthly Interest"
            value={totalMonthlyInterest.toFixed(2)}
            prefix={<FaRupeeSign />}
          />
        </Card>
      </div>

      <Button 
        type="primary"
        icon={<FaSave />}
        onClick={handleSave}
        loading={saving}
        disabled={!principal || !rate || !days}
        style={{ marginBottom: 24 }}
      >
        Save Calculation
      </Button>

      <Divider>Calculation History</Divider>
      <Table
        columns={columns}
        dataSource={calculations}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 5 }}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default InterestCalculator;