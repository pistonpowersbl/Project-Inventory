import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Input, DatePicker, Select, message, Popconfirm, Card, Statistic, Modal } from 'antd';
import { DeleteOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [summary, setSummary] = useState({ outstanding: 0, pendingDeposits: 0, pendingInterest: 0 });
  const [accountLimit, setAccountLimit] = useState(1000000);
  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);
  const [isEditingLimit, setIsEditingLimit] = useState(false);
  const [tempLimit, setTempLimit] = useState(accountLimit);

  // Form fields
  const transactionTypes = [
    { label: 'Deposit', value: 'deposit' },
    { label: 'Withdrawal', value: 'withdrawal' },
    { label: 'Interest - Bank', value: 'interest_bank' },
    { label: 'Interest - Us', value: 'interest_us' },
    { label: 'Other', value: 'other' }
  ];

  // Fetch account limit on component mount
  useEffect(() => {
    const fetchAccountLimit = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/account-limit');
        setAccountLimit(response.data.limit);
      } catch (err) {
        console.error('Error fetching account limit:', err);
      }
    };

    fetchAccountLimit();
  }, []);

  // Handle account limit update
  const handleLimitUpdate = async (value) => {
    const newLimit = Number(value);
    if (isNaN(newLimit) || newLimit <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    try {
      await axios.put('http://localhost:5000/api/account-limit', { limit: newLimit });
      setAccountLimit(newLimit);
      setIsEditingLimit(false);
      message.success('Account limit updated successfully');
    } catch (err) {
      console.error('Error updating account limit:', err);
      message.error('Failed to update account limit');
    }
  };

  // Fetch transactions and calculate summary
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:5000/api/transactions');
        const transactionsData = response.data;
        setTransactions(transactionsData);

        // Calculate summary stats with proper number handling
        const withdrawals = transactionsData
          .filter(t => t.type === 'withdrawal')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        
        const deposits = transactionsData
          .filter(t => t.type === 'deposit')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const interestBank = transactionsData
          .filter(t => t.type === 'interest_bank')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const interestUs = transactionsData
          .filter(t => t.type === 'interest_us')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

        const outstanding = -(withdrawals + interestBank - interestUs - deposits);
        const pendingDeposits = withdrawals - deposits;
        const pendingInterest = interestBank - interestUs;

        setSummary({
          outstanding: Number(outstanding).toFixed(2),
          pendingDeposits: Number(pendingDeposits).toFixed(2),
          pendingInterest: Number(pendingInterest).toFixed(2)
        });
      } catch (err) {
        message.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Add new transaction
  const handleAddTransaction = async (values) => {
    try {
      const response = await axios.post('http://localhost:5000/api/transactions', {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        amount: Number(values.amount)
      });
      
      const updatedTransactions = [response.data, ...transactions];
      setTransactions(updatedTransactions);
      
      // Recalculate summary immediately after adding transaction
      const withdrawals = updatedTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const deposits = updatedTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestBank = updatedTransactions
        .filter(t => t.type === 'interest_bank')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestUs = updatedTransactions
        .filter(t => t.type === 'interest_us')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const outstanding = -(withdrawals + interestBank - interestUs - deposits);
      const pendingDeposits = withdrawals - deposits;
      const pendingInterest = interestBank - interestUs;

      setSummary({
        outstanding: Number(outstanding).toFixed(2),
        pendingDeposits: Number(pendingDeposits).toFixed(2),
        pendingInterest: Number(pendingInterest).toFixed(2)
      });

      message.success('Transaction added!');
      form.resetFields();
    } catch (err) {
      message.error('Failed to add transaction');
    }
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/transactions/${id}`);
      const updatedTransactions = transactions.filter(t => t.id !== id);
      setTransactions(updatedTransactions);
      
      // Recalculate summary immediately after deleting transaction
      const withdrawals = updatedTransactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const deposits = updatedTransactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestBank = updatedTransactions
        .filter(t => t.type === 'interest_bank')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestUs = updatedTransactions
        .filter(t => t.type === 'interest_us')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const outstanding = -(withdrawals + interestBank - interestUs - deposits);
      const pendingDeposits = withdrawals - deposits;
      const pendingInterest = interestBank - interestUs;

      setSummary({
        outstanding: Number(outstanding).toFixed(2),
        pendingDeposits: Number(pendingDeposits).toFixed(2),
        pendingInterest: Number(pendingInterest).toFixed(2)
      });

      message.success('Transaction deleted');
    } catch (err) {
      message.error('Failed to delete transaction');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: date => dayjs(date).format('DD MMM YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: transactionTypes.map(t => ({ text: t.label, value: t.value })),
      onFilter: (value, record) => record.type === value,
      render: type => transactionTypes.find(t => t.value === type)?.label
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount (₹)',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Popconfirm
          title="Delete this transaction?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <Card>
          {isEditingLimit ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                onPressEnter={() => handleLimitUpdate(tempLimit)}
                style={{ width: '80%' }}
                autoFocus
              />
              <Button 
                type="primary" 
                size="small"
                onClick={() => handleLimitUpdate(tempLimit)}
              >
                Save
              </Button>
              <Button 
                size="small"
                onClick={() => {
                  setIsEditingLimit(false);
                  setTempLimit(accountLimit);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Statistic 
                title="Account Limit" 
                value={accountLimit.toLocaleString('en-IN')} 
                prefix="₹" 
                precision={0}
              />
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => {
                  setIsEditingLimit(true);
                  setTempLimit(accountLimit);
                }}
                style={{ marginLeft: 'auto' }}
              />
            </div>
          )}
        </Card>
        <Card>
          <Statistic 
            title="Remaining Usable Amount" 
            value={(accountLimit - Math.abs(Number(summary.outstanding))).toLocaleString('en-IN')} 
            prefix="₹" 
            precision={0}
          />
        </Card>
        <Card>
          <Statistic 
            title="Outstanding" 
            value={Number(summary.outstanding) || 0} 
            prefix="₹" 
            precision={2} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Pending Deposits" 
            value={Number(summary.pendingDeposits) || 0} 
            prefix="₹" 
            precision={2} 
          />
        </Card>
        <Card>
          <Statistic 
            title="Pending Interest" 
            value={Number(summary.pendingInterest) || 0} 
            prefix="₹" 
            precision={2} 
          />
        </Card>
      </div>

      <Modal
        title="Update Account Limit"
        open={isLimitModalVisible}
        onCancel={() => setIsLimitModalVisible(false)}
        footer={null}
      >
        <Form
          onFinish={handleLimitUpdate}
          initialValues={{ limit: accountLimit }}
        >
          <Form.Item
            name="limit"
            label="New Account Limit (₹)"
            rules={[
              { required: true, message: 'Please enter the account limit' },
              { type: 'number', min: 0, message: 'Amount must be greater than 0' }
            ]}
          >
            <Input 
              type="number" 
              style={{ width: '100%' }}
              placeholder="Enter new account limit"
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Limit
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={() => setIsLimitModalVisible(false)}>
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Card title="Add New Transaction" style={{ marginBottom: 24 }}>
        <Form form={form} onFinish={handleAddTransaction} layout="vertical">
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Form.Item
              name="date"
              label="Date"
              initialValue={dayjs()}
              rules={[{ required: true }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select options={transactionTypes} />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Amount (₹)"
              rules={[{ required: true, pattern: /^[0-9]+(\.[0-9]{1,2})?$/ }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input type="number" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true }]}
              style={{ flex: 2, minWidth: 300 }}
            >
              <Input.TextArea rows={1} />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
            Add Transaction
          </Button>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={transactions}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default Transactions;