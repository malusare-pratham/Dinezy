import React, { useEffect, useMemo, useState } from 'react';
import './ManagerDashboard.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const IST_OFFSET_MINUTES = 5 * 60 + 30;

const getISTDateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(istDate.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDaysToISTDateKey = (dateKey, deltaDays) => {
  const key = String(dateKey || '').trim();
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

  const startUtcMs =
    Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000;

  const nextMs = startUtcMs + deltaDays * 24 * 60 * 60 * 1000;
  return getISTDateKey(new Date(nextMs));
};

const formatMMDD = (dateKey) => {
  const key = String(dateKey || '').trim();
  const m = key.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (!m) return key;
  return `${m[1]}-${m[2]}`;
};

const getWeekdayShortFromISTDateKey = (dateKey) => {
  const key = String(dateKey || '').trim();
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return '';

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return '';

  // Convert IST midnight to a UTC date for stable weekday naming.
  const startUtcMs =
    Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - IST_OFFSET_MINUTES * 60 * 1000;

  try {
    return new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(new Date(startUtcMs));
  } catch {
    return '';
  }
};

const ManagerDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const rawUser = localStorage.getItem('dinezy_user');

  let user = null;
  try {
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    user = null;
  }

  const token = localStorage.getItem('dinezy_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const apiBase = useMemo(() => {
    const raw = String(API_URL || '').replace(/\/+$/, '');
    if (raw.toLowerCase().endsWith('/api')) return raw.slice(0, -4);
    return raw;
  }, [API_URL]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const [todaySales, setTodaySales] = useState(0);
  const [todayTax, setTodayTax] = useState(0);
  const [billsToday, setBillsToday] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [salesTrend, setSalesTrend] = useState([]);
  const [topItems, setTopItems] = useState([]);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const todayKey = getISTDateKey(new Date());
        if (!todayKey) throw new Error('Failed to compute today');

        const last7Keys = [];
        for (let i = 6; i >= 0; i--) {
          const k = addDaysToISTDateKey(todayKey, -i);
          if (k) last7Keys.push(k);
        }

        const headers = { Authorization: `Bearer ${token}` };

        const todaySalesReq = fetch(`${apiBase}/api/report/today-sales`, { headers }).then((r) => r.json());
        const todayKotStatsReq = fetch(`${apiBase}/api/report/kot-daily-stats?dateKey=${encodeURIComponent(todayKey)}`, { headers }).then((r) => r.json());
        const todayItemsReq = fetch(`${apiBase}/api/report/kot-daily-items?dateKey=${encodeURIComponent(todayKey)}`, { headers }).then((r) => r.json());

        const trendReqs = last7Keys.map((k) =>
          fetch(`${apiBase}/api/report/kot-daily-items?dateKey=${encodeURIComponent(k)}`, { headers })
            .then((r) => r.json())
            .then((data) => ({ dateKey: k, data }))
        );

        const [todaySalesData, kotStatsData, todayItemsData, ...trendData] = await Promise.all([
          todaySalesReq,
          todayKotStatsReq,
          todayItemsReq,
          ...trendReqs,
        ]);

        if (!todaySalesData?.success) throw new Error(todaySalesData?.message || 'Failed to load today sales');
        setTodaySales(Number(todaySalesData?.totalSales || 0));
        setTodayTax(Number(todaySalesData?.totalTax || 0));
        setBillsToday(Number(todaySalesData?.totalBills || 0));

        if (!kotStatsData?.success) throw new Error(kotStatsData?.message || 'Failed to load active orders');
        const stats = kotStatsData?.stats || {};
        const received = Number(stats.receivedCount || 0);
        const preparing = Number(stats.preparingCount || 0);
        const ready = Number(stats.readyCount || 0);
        setActiveOrders(received + preparing + ready);

        if (!todayItemsData?.success) throw new Error(todayItemsData?.message || 'Failed to load top items');
        const report = todayItemsData?.report || {};
        const list = Array.isArray(report.topItems) ? report.topItems : [];
        setTopItems(
          list.slice(0, 5).map((it, idx) => ({
            id: String(it?.menuItem || it?._id || idx),
            name: String(it?.name || '').trim() || 'Item',
            count: Number(it?.quantity || 0),
          }))
        );

        const byKey = new Map(trendData.map((row) => [String(row?.dateKey || ''), row?.data]));
        setSalesTrend(
          last7Keys.map((k) => ({
            dateKey: k,
            date: `${getWeekdayShortFromISTDateKey(k)} ${formatMMDD(k)}`.trim(),
            sales: Number(byKey.get(String(k))?.report?.totalAmount || 0),
          }))
        );
      } catch (e) {
        setLoadError(e?.message || 'Failed to load dashboard');
        setTodaySales(0);
        setTodayTax(0);
        setBillsToday(0);
        setActiveOrders(0);
        setSalesTrend([]);
        setTopItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [apiBase, token]);

  return (
    <div className="dashboard-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} showCloseIcon />

      <div className="dashboard-content">
        <Header
          title="Manager Dashboard"
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
          hideTitlesOnMobile
        />

        <div className="page-content">
          <div className="manager-dashboard">
            <div className="stats-container">
              <div className="stat-card card-sales">
                <div className="card-content">
                  <p className="label">TODAY'S SALES</p>
                  <h2 className="val">₹{Number(todaySales || 0).toFixed(2)}</h2>
                </div>
                <i className="fa-solid fa-arrow-trend-up icon"></i>
              </div>

              <div className="stat-card card-tax">
                <div className="card-content">
                  <p className="label">TODAY'S TAX</p>
                  <h2 className="val yellow">₹{Number(todayTax || 0).toFixed(2)}</h2>
                </div>
                <i className="fa-solid fa-coins icon"></i>
              </div>

              <div className="stat-card card-bills">
                <div className="card-content">
                  <p className="label">BILLS TODAY</p>
                  <h2 className="val green">{Number(billsToday || 0)}</h2>
                </div>
                <i className="fa-solid fa-receipt icon"></i>
              </div>

              <div className="stat-card card-orders">
                <div className="card-content">
                  <p className="label">ACTIVE ORDERS</p>
                  <h2 className="val blue">{Number(activeOrders || 0)}</h2>
                  <p className="sub-val">0 low-stock alerts</p>
                </div>
                <i className="fa-solid fa-box icon"></i>
              </div>
            </div>

            <div className="main-grid">
              <div className="chart-section box">
                <div className="box-header">
                  <h3>Sales Trend (7 days)</h3>
                  <i className="fa-solid fa-indian-rupee-sign"></i>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--app-border)" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--app-muted)', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'var(--app-surface-2)' }}
                        labelFormatter={(_, payload) => payload?.[0]?.payload?.dateKey || ''}
                        contentStyle={{ backgroundColor: 'var(--app-surface)', border: '1px solid var(--app-border)', borderRadius: '8px', color: 'var(--app-text)' }}
                      />
                      <Bar dataKey="sales" radius={[5, 5, 0, 0]}>
                        {(salesTrend || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.sales > 0 ? '#ff4d24' : '#333'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {isLoading && !loadError && (
                    <div className="dash-loading" role="status">Loading...</div>
                  )}
                  {loadError && (
                    <div className="dash-error" role="status">{loadError}</div>
                  )}
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

                  {!isLoading && !loadError && topItems.length === 0 && (
                    <div className="dash-empty">No items</div>
                  )}
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
