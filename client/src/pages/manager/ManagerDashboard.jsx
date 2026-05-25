import React, { useState } from 'react';
import './ManagerDashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const ManagerDashboard = () => {

  const [sidebarOpen,setSidebarOpen] =
    useState(false);

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;
  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }
  // सेल्स डेटा (Bar Chart साठी)
  const salesData = [
    { date: '05-04', sales: 0 },
    { date: '05-05', sales: 0 },
    { date: '05-06', sales: 0 },
    { date: '05-07', sales: 2600 },
    { date: '05-08', sales: 0 },
    { date: '05-09', sales: 0 },
    { date: '05-10', sales: 800 },
  ];

  // टॉप आयटम्स डेटा
  const topItems = [
    { id: 1, name: "Paneer Tikka", count: 5 },
    { id: 2, name: "Veg Manchurian", count: 4 },
    { id: 3, name: "Tandoori Roti", count: 2 },
    { id: 4, name: "Paneer Butter Masala", count: 1 },
    { id: 5, name: "Veg Biryani", count: 1 },
  ];

  return (
    <div className="dashboard-layout">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">

        <Header
          title="Manager Dashboard"
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="page-content">

          <div className="manager-dashboard">

            {/* Stats Cards Grid */}
            <div className="stats-container">
        <div className="stat-card card-sales">
          <div className="card-content">
            <p className="label">TODAY'S SALES</p>
            <h2 className="val">₹714.00</h2>
          </div>
          <i className="fa-solid fa-arrow-trend-up icon"></i>
        </div>

        <div className="stat-card card-tax">
          <div className="card-content">
            <p className="label">TODAY'S TAX</p>
            <h2 className="val yellow">₹34.00</h2>
          </div>
          <i className="fa-solid fa-coins icon"></i>
        </div>

        <div className="stat-card card-bills">
          <div className="card-content">
            <p className="label">BILLS TODAY</p>
            <h2 className="val green">1</h2>
          </div>
          <i className="fa-solid fa-receipt icon"></i>
        </div>

        <div className="stat-card card-orders">
          <div className="card-content">
            <p className="label">ACTIVE ORDERS</p>
            <h2 className="val blue">0</h2>
            <p className="sub-val">0 low-stock alerts</p>
          </div>
          <i className="fa-solid fa-box icon"></i>
        </div>
      </div>

      {/* Main Content (Chart and Top Items) */}
      <div className="main-grid">
        <div className="chart-section box">
          <div className="box-header">
            <h3>Sales Trend (7 days)</h3>
            <i className="fa-solid fa-indian-rupee-sign"></i>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#222" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#1a1a1a'}}
                  contentStyle={{backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px'}}
                />
                <Bar dataKey="sales" radius={[5, 5, 0, 0]}>
                  {salesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.sales > 0 ? "#ff4d24" : "#333"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="top-items-section box">
          <div className="box-header">
            <h3>Top Items</h3>
          </div>
          <div className="items-list">
            {topItems.map((item, index) => (
              <div className="item-row" key={item.id}>
                <span className="rank">{index + 1}</span>
                <span className="name">{item.name}</span>
                <span className="count">×{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
        </div>

        </div>

      </div>

    </div>
  );
};

export default ManagerDashboard;

