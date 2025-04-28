// Dashboard.js
import React, { useState, useEffect } from 'react';
import { Card, Statistic, Progress, Row, Col } from 'antd';
import { FaRupeeSign } from 'react-icons/fa';
import axios from 'axios';
import dayjs from 'dayjs';

const Dashboard = ({ activeTab }) => {
  const [summary, setSummary] = useState({
    accountLimit: 1000000,
    outstanding: 0,
    pendingDeposits: 0,
    pendingInterest: 0,
    monthlyInterest: 0
  });

  const fetchData = async () => {
    try {
      // Fetch account limit
      const limitResponse = await axios.get('http://localhost:5000/api/account-limit');
      const accountLimit = limitResponse.data.limit || 1000000; // Default value if not found

      // Fetch transactions data
      const transactionsResponse = await axios.get('http://localhost:5000/api/transactions');
      const transactions = transactionsResponse.data || [];

      // Fetch calculations data for monthly interest
      const calculationsResponse = await axios.get('http://localhost:5000/api/calculations');
      const calculations = calculationsResponse.data || [];

      // Calculate summary stats from transactions
      const withdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const deposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestBank = transactions
        .filter(t => t.type === 'interest_bank')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const interestUs = transactions
        .filter(t => t.type === 'interest_us')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

      const outstanding = -(withdrawals + interestBank - interestUs - deposits);
      const pendingDeposits = withdrawals - deposits;
      const pendingInterest = interestBank - interestUs;

      // Calculate monthly interest from calculations
      const currentMonth = dayjs().format('YYYY-MM');
      const monthlyInterest = calculations
        .filter(calc => dayjs(calc.date).format('YYYY-MM') === currentMonth)
        .reduce((sum, calc) => sum + (Number(calc.calculated_interest) || 0), 0);

      setSummary({
        accountLimit: Number(accountLimit) || 1000000,
        outstanding: Number(outstanding) || 0,
        pendingDeposits: Number(pendingDeposits) || 0,
        pendingInterest: Number(pendingInterest) || 0,
        monthlyInterest: Number(monthlyInterest) || 0
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Set default values in case of error
      setSummary(prev => ({
        ...prev,
        outstanding: 0,
        pendingDeposits: 0,
        pendingInterest: 0,
        monthlyInterest: 0
      }));
    }
  };

  useEffect(() => {
    // Fetch data when component mounts or when activeTab changes to 'dashboard'
    if (activeTab === 'dashboard') {
      fetchData();
    }
  }, [activeTab]);

  const usagePercentage = (Math.abs(summary.outstanding) / summary.accountLimit) * 100;

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ marginBottom: '24px' }}>Cash Credit Account Dashboard</h2>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Account Limit"
              value={summary.accountLimit}
              prefix={<FaRupeeSign />}
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Outstanding"
              value={summary.outstanding}
              prefix={<FaRupeeSign />}
              precision={2}
              valueStyle={{ color: summary.outstanding < 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="Total Monthly Interest"
              value={summary.monthlyInterest}
              prefix={<FaRupeeSign />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h3>Credit Usage</h3>
          <Progress 
            percent={usagePercentage} 
            status={usagePercentage > 80 ? 'exception' : usagePercentage > 50 ? 'warning' : 'active'}
            format={percent => `${percent.toFixed(1)}%`}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
          <span>Used: ₹{Math.abs(summary.outstanding).toLocaleString('en-IN')}</span>
          <span>Available: ₹{(summary.accountLimit - Math.abs(summary.outstanding)).toLocaleString('en-IN')}</span>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;