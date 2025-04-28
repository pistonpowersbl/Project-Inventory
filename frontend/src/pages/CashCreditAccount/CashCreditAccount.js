import React, { useState } from 'react';
import Dashboard from './Dashboard';
import Transactions from './Transactions';
import InterestCalculator from './InterestCalculator';
import { Tabs } from 'antd';

const CashCreditAccount = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: <Dashboard activeTab={activeTab} />,
    },
    {
      key: 'transactions',
      label: 'Transactions',
      children: <Transactions />,
    },
    {
      key: 'interest',
      label: 'Interest Calculator',
      children: <InterestCalculator />,
    },
  ];

  return (
    <div className="cash-credit-account">
      <h1>Cash Credit Account Tracker</h1>
      <Tabs 
        activeKey={activeTab} 
        items={tabItems} 
        onChange={(key) => setActiveTab(key)} 
      />
    </div>
  );
};

export default CashCreditAccount;