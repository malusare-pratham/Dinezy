import { useEffect, useMemo, useRef, useState } from 'react';
import './KitchenDashboard.css';

import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';
import { useNavigate } from 'react-router-dom';

const KitchenDashboard = ({
  withSidebar = false
}) => {

  const navigate = useNavigate();
  const [sidebarOpen,setSidebarOpen] = useState(false);

  // हे डेटा तुझे ऑर्डर्स दाखवण्यासाठी आहे
  const token =
    localStorage.getItem('dinezy_token');

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  const apiBase = useMemo(() => {
    const raw = String(API_URL || '').replace(/\/+$/,'');
    if(raw.toLowerCase().endsWith('/api')){
      return raw.slice(0,-4);
    }
    return raw;
  },[API_URL]);

  const [kots,setKots] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [nowMs,setNowMs] = useState(Date.now());

  const AUTO_REFRESH_MS = 2000;
  const refreshInFlightRef = useRef(false);

  const getISTDateKey = (dateLike) => {
    try{
      const d =
        dateLike instanceof Date ? dateLike : new Date(dateLike);
      if(Number.isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-CA',{ timeZone:'Asia/Kolkata' });
    }
    catch{
      return '';
    }
  };

  const [selectedDateKey,setSelectedDateKey] = useState(
    () => getISTDateKey(new Date())
  );

  const [dailyStats,setDailyStats] = useState({
    receivedCount:0,
    preparingCount:0,
    completedCount:0
  });

  const handleLogout = () => {
    try{
      localStorage.removeItem('dinezy_token');
      localStorage.removeItem('dinezy_user');
    }
    catch{
      // ignore
    }
    finally{
      navigate('/', { replace:true });
    }
  };

  const fetchKots = async () => {

    const res = await fetch(
      `${apiBase}/api/kot/all`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if(!res.ok || !data?.success){
      throw new Error(
        data?.message || 'Failed to load KOTs'
      );
    }

    setKots(data.kots || []);

  };

  const fetchDailyStats = async (dateKey) => {
    const key = String(dateKey || '').trim();
    if(!key) return;

    const res = await fetch(
      `${apiBase}/api/report/kot-daily-stats?dateKey=${encodeURIComponent(key)}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if(!res.ok || !data?.success){
      throw new Error(
        data?.message || 'Failed to load daily stats'
      );
    }

    const s = data?.stats || {};
    setDailyStats({
      receivedCount:Number(s?.receivedCount || 0),
      preparingCount:Number(s?.preparingCount || 0),
      completedCount:Number(s?.completedCount || 0)
    });
  };

  useEffect(() => {
    if(!token) return;

    const load = async () => {
      setIsLoading(true);
      try{
        await fetchKots();
        await fetchDailyStats(selectedDateKey);
      }
      catch(error){
        alert(error.message);
      }
      finally{
        setIsLoading(false);
      }
    };

    load();
  },[token,selectedDateKey]);

  useEffect(() => {
    const tick = setInterval(() => {
      setNowMs(Date.now());
    },1000);

    const refresh = setInterval(() => {
      if(token){
        if(refreshInFlightRef.current) return;
        refreshInFlightRef.current = true;

        Promise.all([
          fetchKots().catch(() => {}),
          fetchDailyStats(selectedDateKey).catch(() => {})
        ])
          .finally(() => {
            refreshInFlightRef.current = false;
          });
      }
    },AUTO_REFRESH_MS);

    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  },[token,selectedDateKey]);

  const formatMMSS = (ms) => {
    const total = Math.max(0,Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const getPhaseStart = (kot) => {
    const ts = kot?.statusTimestamps || {};

    if(kot?.status === 'RECEIVED'){
      return ts.receivedAt || kot?.createdAt;
    }

    if(kot?.status === 'PREPARING'){
      return ts.preparingAt || kot?.updatedAt || kot?.createdAt;
    }

    if(kot?.status === 'READY'){
      return ts.readyAt || kot?.updatedAt || kot?.createdAt;
    }

    return ts.completedAt || kot?.updatedAt || kot?.createdAt;
  };

  const orders = useMemo(() => {
    return (kots || [])
      .filter((k) => getISTDateKey(k?.createdAt) === String(selectedDateKey || '').trim())
      .filter((k) => k.status !== 'COMPLETED')
      .map((k) => {

        const start =
          new Date(getPhaseStart(k)).getTime();

        const elapsed =
          Number.isFinite(start)
            ? (nowMs - start)
            : 0;

        return {
          id:k._id,
          tokenNumber:k.tokenNumber,
          table:k.tableCode || `T-${k.tableNumber}`,
          time:formatMMSS(elapsed),
          items:(k.items || []).map((i) => ({
            name:i.name,
            qty:i.quantity
          })),
          captain:k.captain?.name || 'Captain',
          status:k.status
        };
      });

  },[kots,nowMs,selectedDateKey]);

  const updateStatus = async (
    kotId,
    nextStatus
  ) => {

    setIsLoading(true);

    try{

      const res = await fetch(
        `${apiBase}/api/kot/update-status/${kotId}`,
        {
          method:'PUT',
          headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${token}`
          },
          body:JSON.stringify({
            status:nextStatus
          })
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(
          data?.message || 'Failed to update status'
        );
      }

      await fetchKots();

    }
    catch(error){
      alert(error.message);
    }
    finally{
      setIsLoading(false);
    }

  };

  const content = (
    <div className={withSidebar ? 'kds-wrapper kds-embed' : 'kds-wrapper'}>
      {/* Header Section */}
      <header className="kds-header">
        <div className="header-left">
          <p className="kds-subtitle">LIVE KITCHEN</p>
          <h1>Kitchen Display System</h1>
        </div>
        <div className="header-right">
          <div className="kds-toolbar">
            <span className="refresh-text">Auto-refresh • 2s</span>
            <label className="kds-date">
              <span className="kds-date-label">Day</span>
              <input
                type="date"
                value={selectedDateKey}
                onChange={(e) => setSelectedDateKey(e.target.value)}
              />
            </label>
            {!withSidebar && (
              <button
                type="button"
                className="kds-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="kds-stats">
        <div className="kds-stat-card running">
          <div className="kds-stat-label">Running KOT</div>
          <div className="kds-stat-value">{dailyStats.receivedCount}</div>
        </div>
        <div className="kds-stat-card preparing">
          <div className="kds-stat-label">Preparing KOT</div>
          <div className="kds-stat-value">{dailyStats.preparingCount}</div>
        </div>
        <div className="kds-stat-card completed">
          <div className="kds-stat-label">Completed KOT</div>
          <div className="kds-stat-value">{dailyStats.completedCount}</div>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="kds-grid">
        
        {/* Column 1: New */}
        <div className="kds-column">
          <div className="column-header">
            <h3><i className="fa-solid fa-clock-rotate-left yellow"></i> New</h3>
            <span className="count">
              {orders.filter(o => o.status === 'RECEIVED').length}
            </span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'RECEIVED').length === 0 ? (
              <div className="column-content empty">
                <p>{isLoading ? 'Loading...' : '— empty —'}</p>
              </div>
            ) : orders.filter(o => o.status === 'RECEIVED').map(order => (
              <div key={order.id} className="kot-card">
                <div className="kot-top">
                  <div className="kot-meta">
                    <p>KOT</p>
                    <h2 className="kot-id">{order.tokenNumber || '#'}</h2>
                  </div>
                  <div className="kot-meta-right">
                    <p>{order.table}</p>
                    <h2 className="kot-time">{order.time}</h2>
                  </div>
                </div>

                <div className="kot-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.name}</span>
                      <span>×{item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="kot-footer">
                  <p>Captain: {order.captain}</p>
                  <button
                    className="start-btn"
                    onClick={() => updateStatus(order.id,'PREPARING')}
                    disabled={isLoading}
                  >
                    Start Prep
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Preparing */}
        <div className="kds-column">
          <div className="column-header">
            <h3><i className="fa-solid fa-fire-orange orange"></i> Preparing</h3>
            <span className="count">
              {orders.filter(o => o.status === 'PREPARING').length}
            </span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'PREPARING').length === 0 ? (
              <div className="column-content empty">
                <p>— empty —</p>
              </div>
            ) : orders.filter(o => o.status === 'PREPARING').map(order => (
              <div key={order.id} className="kot-card">
                <div className="kot-top">
                  <div className="kot-meta">
                    <p>KOT</p>
                    <h2 className="kot-id">{order.tokenNumber || '#'}</h2>
                  </div>
                  <div className="kot-meta-right">
                    <p>{order.table}</p>
                    <h2 className="kot-time">{order.time}</h2>
                  </div>
                </div>

                <div className="kot-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.name}</span>
                      <span>×{item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="kot-footer">
                  <p>Captain: {order.captain}</p>
                  <button
                    className="start-btn kds-ready-btn"
                    onClick={() => updateStatus(order.id,'READY')}
                    disabled={isLoading}
                  >
                    Mark Ready
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Ready */}
        <div className="kds-column">
          <div className="column-header">
            <h3><i className="fa-solid fa-circle-check green"></i> Ready</h3>
            <span className="count">
              {orders.filter(o => o.status === 'READY').length}
            </span>
          </div>
          <div className="column-content">
            {orders.filter(o => o.status === 'READY').length === 0 ? (
              <div className="column-content empty">
                <p>— empty —</p>
              </div>
            ) : orders.filter(o => o.status === 'READY').map(order => (
              <div key={order.id} className="kot-card">
                <div className="kot-top">
                  <div className="kot-meta">
                    <p>KOT</p>
                    <h2 className="kot-id">{order.tokenNumber || '#'}</h2>
                  </div>
                  <div className="kot-meta-right">
                    <p>{order.table}</p>
                    <h2 className="kot-time">{order.time}</h2>
                  </div>
                </div>

                <div className="kot-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="item-row">
                      <span>{item.name}</span>
                      <span>×{item.qty}</span>
                    </div>
                  ))}
                </div>

                <div className="kot-footer">
                  <p>Captain: {order.captain}</p>
                  <button
                    className="start-btn kds-complete-btn"
                    onClick={() => updateStatus(order.id,'COMPLETED')}
                    disabled={isLoading}
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  if(!withSidebar){
    return content;
  }

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;
  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }

  return (
    <div className="dashboard-layout">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">

        <Header
          title="Kitchen Display"
          user={user}
          showLogout={false}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="page-content">
          {content}
        </div>

      </div>

    </div>
  );
};

export default KitchenDashboard;

