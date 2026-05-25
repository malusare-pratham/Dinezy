import './CaptainDashboard.css';

import { useEffect, useMemo, useRef, useState } from 'react';

import Header from '../../components/common/Header';
import Toast from '../../components/common/Toast';
import SelectSection from '../../components/captain components/SelectSection';
import TableList from '../../components/captain components/TableList';
import OrderSection from '../../components/captain components/OrderSection';
import Billing from '../../components/captain components/Billing';

import { getSocket } from '../../socket/socket';

let notificationAudioCtx = null;

const getNotificationAudioCtx = () => {
  const AudioCtx =
    window.AudioContext ||
    window.webkitAudioContext;
  if(!AudioCtx) return null;

  if(notificationAudioCtx){
    return notificationAudioCtx;
  }

  notificationAudioCtx = new AudioCtx();
  return notificationAudioCtx;
};

const playNotificationSound = async () => {
  try{
    const ctx = getNotificationAudioCtx();
    if(!ctx) return;

    if(ctx.state === 'suspended'){
      try{ await ctx.resume(); } catch{}
    }

    const compressor = (() => {
      try{
        const c = ctx.createDynamicsCompressor();
        c.threshold.setValueAtTime(-18, ctx.currentTime);
        c.knee.setValueAtTime(30, ctx.currentTime);
        c.ratio.setValueAtTime(12, ctx.currentTime);
        c.attack.setValueAtTime(0.003, ctx.currentTime);
        c.release.setValueAtTime(0.12, ctx.currentTime);
        return c;
      }
      catch{
        return null;
      }
    })();

    const output =
      compressor || ctx.destination;

    if(compressor){
      compressor.connect(ctx.destination);
    }

    const beep = (t, freq, dur = 0.22) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001,ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.55,ctx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime + t + Math.max(0.06, dur - 0.04));
      o.connect(g);
      g.connect(output);
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + dur);
    };

    beep(0,880,0.24);
    beep(0.2,660,0.24);
    beep(0.4,880,0.24);
  }
  catch{
    // ignore
  }
};

const loadNotifications = (userId) => {
  try{
    const raw =
      localStorage.getItem(`dinezy_notifications_${userId}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  }
  catch{
    return [];
  }
};

const saveNotifications = (userId, list) => {
  try{
    localStorage.setItem(
      `dinezy_notifications_${userId}`,
      JSON.stringify(Array.isArray(list) ? list : [])
    );
  }
  catch{
    // ignore
  }
};

const CaptainDashboard = () => {

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;
  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }

  const viewStorageKey =
    user?._id
      ? `dinezy_captain_view_${user._id}`
      : 'dinezy_captain_view';

  const loadView = () => {
    try{
      const raw = localStorage.getItem(viewStorageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if(!parsed || typeof parsed !== 'object') return null;
      return parsed;
    }
    catch{
      return null;
    }
  };

  const saveView = (next) => {
    try{
      localStorage.setItem(
        viewStorageKey,
        JSON.stringify(next || null)
      );
    }
    catch{
      // ignore
    }
  };

  const initialView = loadView();

  const [selectedSection,setSelectedSection] =
    useState(
      initialView?.mode === 'section'
        ? (initialView?.sectionKey || null)
        : null
    );

  const [selectedTable,setSelectedTable] =
    useState(null);

  const [billingPayload,setBillingPayload] =
    useState(null);

  const [restore,setRestore] = useState(() => ({
    mode: initialView?.mode || null,
    tableId: initialView?.tableId || null
  }));

  const [notifications,setNotifications] =
    useState(() => (user?._id ? loadNotifications(user._id) : []));

  const [toast,setToast] = useState({
    open:false,
    message:''
  });

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

  const [tables,setTables] = useState([]);
  const [bills,setBills] = useState([]);
  const audioUnlockedRef = useRef(false);

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

  const todayKey = useMemo(
    () => getISTDateKey(new Date()),
    []
  );

  const fetchTables = async () => {
    if(!token) return;
    const res = await fetch(
      `${apiBase}/api/table/all`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    if(!res.ok || !data?.success){
      throw new Error(data?.message || 'Failed to load tables');
    }

    setTables(Array.isArray(data.tables) ? data.tables : []);
  };

  const fetchBills = async () => {
    if(!token) return;
    const res = await fetch(
      `${apiBase}/api/bill/all`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    if(!res.ok || !data?.success){
      throw new Error(data?.message || 'Failed to load bills');
    }

    setBills(Array.isArray(data.bills) ? data.bills : []);
  };

  // KOT fetch removed (running orders stat removed)

  useEffect(() => {
    const unlock = async () => {
      if(audioUnlockedRef.current) return;
      const ctx = getNotificationAudioCtx();
      if(!ctx) return;
      try{
        if(ctx.state === 'suspended'){
          await ctx.resume();
        }
        audioUnlockedRef.current = true;
      }
      catch{
        // ignore
      }
    };

    window.addEventListener('pointerdown', unlock, { passive:true });
    window.addEventListener('keydown', unlock);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  },[]);

  useEffect(() => {
    if(!token) return;
    fetchTables().catch(() => {});
    fetchBills().catch(() => {});

    const id = setInterval(() => {
      fetchTables().catch(() => {});
      fetchBills().catch(() => {});
    },6000);

    return () => clearInterval(id);
  },[token]);

  // Restore last open view (table/billing) after refresh.
  useEffect(() => {
    const mode = restore?.mode;
    const tableId = restore?.tableId ? String(restore.tableId) : '';
    if(!mode || !tableId) return;
    if(!Array.isArray(tables) || tables.length === 0) return;
    if(selectedTable?._id) return;

    const t =
      tables.find((x) => String(x?._id || '') === tableId) || null;

    if(!t) return;

    setSelectedSection((prev) => prev || t?.section || null);
    setSelectedTable(t);

    if(mode === 'billing'){
      setBillingPayload({
        table:t,
        customerName:'',
        customerPhone:''
      });
    }

    setRestore({ mode:null, tableId:null });
  },[restore, tables, selectedTable?._id]);

  // Persist view on navigation changes.
  useEffect(() => {
    if(billingPayload?.table?._id){
      saveView({
        mode:'billing',
        tableId:String(billingPayload.table._id),
        sectionKey: selectedSection || null
      });
      return;
    }

    if(selectedTable?._id){
      saveView({
        mode:'table',
        tableId:String(selectedTable._id),
        sectionKey: selectedSection || null
      });
      return;
    }

    if(selectedSection){
      saveView({
        mode:'section',
        sectionKey:selectedSection
      });
      return;
    }

    saveView(null);
  },[billingPayload?.table?._id, selectedTable?._id, selectedSection]);

  const stats = useMemo(() => {
    const all = Array.isArray(tables) ? tables : [];
    const captainId = String(user?._id || '');
    const activeCaptainId = (t) =>
      String(t?.activeCaptain?._id || t?.activeCaptain || '');

    const available =
      all.filter((t) => String(t?.status || '').toUpperCase() === 'AVAILABLE').length;

    const running =
      all.filter((t) => (
        String(t?.status || '').toUpperCase() === 'RUNNING' &&
        activeCaptainId(t) === captainId
      )).length;

    const completedToday =
      (Array.isArray(bills) ? bills : [])
        .filter((b) => String(b?.captain?._id || b?.captain || '') === captainId)
        .filter((b) => getISTDateKey(b?.createdAt) === todayKey)
        .length;

    return {
      available,
      runningTables:running,
      completedTablesToday:completedToday
    };
  },[tables,bills,user?._id,todayKey]);

  const clearNotifications = () => {
    if(!user?._id) return;
    setNotifications([]);
    saveNotifications(user._id,[]);
  };

  const addNotification = (n) => {
    if(!user?._id) return;

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      message:String(n?.message || '').trim(),
      tableCode:String(n?.tableCode || '').trim(),
      tokenNumber:String(n?.tokenNumber || '').trim(),
      status:String(n?.status || '').trim(),
      createdAt:n?.createdAt || new Date().toISOString()
    };

    setNotifications((prev) => {
      const next = [entry, ...(Array.isArray(prev) ? prev : [])].slice(0,50);
      saveNotifications(user._id,next);
      return next;
    });

    playNotificationSound();
    setToast({
      open:true,
      message: entry.message || 'Notification'
    });
  };

  useEffect(() => {
    if(!user?._id) return;

    const socket = getSocket();

    socket.emit('register-user', {
      userId:user._id,
      role:user.role,
      name:user.name
    });

    const onNotify = (payload) => addNotification(payload);
    socket.on('captain-notification', onNotify);

    return () => {
      socket.off('captain-notification', onNotify);
    };
  },[user?._id]);

  return (
    <div className="captain-layout">
      <div className="captain-main">
        <Header
          title={user?.name ? user.name : 'Captain'}
          user={user}
          notifications={notifications}
          onClearNotifications={clearNotifications}
        />

        <div className="captain-content">
          <Toast
            open={toast.open}
            message={toast.message}
            variant="success"
            onClose={() => setToast((t) => ({...t, open:false}))}
          />

          <div className="captain-stats">
            <div className="captain-stat-card completed">
              <div className="captain-stat-text">
                <div className="label">
                  <span className="full">Completed Tables (Today)</span>
                  <span className="short">Completed</span>
                </div>
                <div className="value">{stats.completedTablesToday}</div>
              </div>
            </div>
            <div className="captain-stat-card running">
              <div className="captain-stat-text">
                <div className="label">
                  <span className="full">Running Tables</span>
                  <span className="short">Running</span>
                </div>
                <div className="value">{stats.runningTables}</div>
              </div>
            </div>
            <div className="captain-stat-card available">
              <div className="captain-stat-text">
                <div className="label">
                  <span className="full">Available Tables</span>
                  <span className="short">Available</span>
                </div>
                <div className="value">{stats.available}</div>
              </div>
            </div>
          </div>

          {
            billingPayload
              ? (
                   <Billing
                     {...billingPayload}
                     onBack={() => {
                       setBillingPayload(null);
                       if(billingPayload?.table?._id){
                         saveView({
                           mode:'table',
                           tableId:String(billingPayload.table._id),
                           sectionKey: billingPayload?.table?.section || selectedSection || null
                         });
                       }
                     }}
                     onComplete={() => {
                       const sectionKey =
                         billingPayload?.table?.section || null;
                       setBillingPayload(null);
                       setSelectedTable(null);
                       setSelectedSection(sectionKey);
                       saveView({
                         mode:'section',
                         sectionKey: sectionKey || null
                       });
                     }}
                   />
                 )
              : selectedTable
              ? (
                  <OrderSection
                    table={selectedTable}
                    onBack={() => {
                      setSelectedTable(null);
                      setBillingPayload(null);
                      saveView({
                        mode:'section',
                        sectionKey:selectedSection || null
                      });
                    }}
                    onOpenBilling={(payload) => setBillingPayload(payload)}
                  />
                )
              : selectedSection
              ? (
                  <TableList
                    sectionKey={selectedSection}
                    onBack={() => {
                      setSelectedSection(null);
                      setSelectedTable(null);
                      setBillingPayload(null);
                      saveView(null);
                    }}
                    onSelectTable={(table) => {
                      setSelectedTable(table);
                      if(table?.section){
                        setSelectedSection(table.section);
                      }
                      saveView({
                        mode:'table',
                        tableId:String(table?._id || ''),
                        sectionKey: table?.section || selectedSection || null
                      });
                    }}
                    captainId={user?._id || null}
                  />
                )
              : (
                  <SelectSection
                    onSelectSection={(key) => {
                      setSelectedSection(key);
                      saveView({
                        mode:'section',
                        sectionKey:key
                      });
                    }}
                  />
              )
          }
        </div>
      </div>
    </div>
  );
};

export default CaptainDashboard;
