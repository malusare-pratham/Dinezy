import './TableView.css';

import { useEffect, useMemo, useState } from 'react';

import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const useMediaQuery = (query) => {
  const getMatch = () => {
    if(typeof window === 'undefined') return false;
    if(typeof window.matchMedia !== 'function') return false;
    return window.matchMedia(query).matches;
  };

  const [matches,setMatches] = useState(getMatch);

  useEffect(() => {
    if(typeof window === 'undefined') return;
    if(typeof window.matchMedia !== 'function') return;

    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();

    if(typeof mql.addEventListener === 'function'){
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    }

    mql.addListener(onChange);
    return () => mql.removeListener(onChange);
  },[query]);

  return matches;
};

const formatDateTime = (date) => {
  try{
    return new Intl.DateTimeFormat(
      'en-IN',
      {
        day:'2-digit',
        month:'short',
        year:'numeric',
        hour:'numeric',
        minute:'2-digit'
      }
    ).format(date);
  }
  catch{
    return String(date);
  }
};

const TableView = ({
  withSidebar = false
}) => {

  const token =
    localStorage.getItem('dinezy_token');

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  const SECTION_META = [
    { key:'HALL', label:'Main Hall', prefix:'M' },
    { key:'AC', label:'AC Section', prefix:'A' },
    { key:'FAMILY', label:'Family Section', prefix:'F' },
    { key:'BAR', label:'Bar Section', prefix:'B' }
  ];

  const [selectedSection,setSelectedSection] =
    useState('HALL');

  const [tables,setTables] = useState([]);
  const [kots,setKots] = useState([]);
  const [isLoading,setIsLoading] = useState(false);
  const [loadError,setLoadError] = useState('');

  const [selectedTable,setSelectedTable] =
    useState(null);

  const [serverBillItems,setServerBillItems] =
    useState([]);

  // Per-table manual changes to bill preview so auto-refresh doesn’t wipe them.
  // key = `${name}@@${price}@@${gst}`
  const [billOverrides,setBillOverrides] =
    useState({});

  const [billDraftLoaded,setBillDraftLoaded] =
    useState(false);

  const [paymentMethod,setPaymentMethod] =
    useState('');

  const [isPayConfirmOpen,setIsPayConfirmOpen] =
    useState(false);

  const [sidebarOpen,setSidebarOpen] =
    useState(false);

  const isCompactLayout =
    useMediaQuery('(max-width: 1080px)');

  useEffect(() => {
    if(!selectedTable) return;

    const onKeyDown = (e) => {
      if(e.key === 'Escape'){
        if(isPayConfirmOpen) return;
        if(isLoading) return;
        setSelectedTable(null);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  },[selectedTable, isPayConfirmOpen, isLoading]);

  const [isAddItemOpen,setIsAddItemOpen] =
    useState(false);

  const [menus,setMenus] = useState([]);
  const [menuQuery,setMenuQuery] = useState('');
  const [isMenuLoading,setIsMenuLoading] = useState(false);

  const fetchMenus = async () => {
    const res = await fetch(
      `${API_URL}/api/menu/all`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    if(!res.ok || !data?.success){
      throw new Error(
        data?.message || 'Failed to load menu'
      );
    }

    setMenus(data.menus || []);
  };

  const fetchTables = async () => {

    const res = await fetch(
      `${API_URL}/api/table/all`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if(!res.ok || !data?.success){
      throw new Error(
        data?.message || 'Failed to load tables'
      );
    }

    setTables(data.tables || []);

  };

  const fetchKots = async () => {

    const res = await fetch(
      `${API_URL}/api/kot/all`,
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

  useEffect(() => {
    if(!token) return;

    const load = async () => {

      setIsLoading(true);
      setLoadError('');

      try{
        await Promise.all([
          fetchTables(),
          fetchKots()
        ]);
      }
      catch(error){
        setLoadError(error?.message || 'Failed to load data');
        alert(error.message);
      }
      finally{
        setIsLoading(false);
      }

    };

    load();
  },[token]);

  useEffect(() => {
    if(!token) return;
    setIsMenuLoading(true);
    fetchMenus()
      .catch(() => {})
      .finally(() => setIsMenuLoading(false));
  },[token]);

  useEffect(() => {
    if(!token) return;
    const id = setInterval(() => {
      fetchTables().catch(() => {});
      fetchKots().catch(() => {});
    },6000);
    return () => clearInterval(id);
  },[token]);

  useEffect(() => {
    if(!selectedTable) return;

    const tid =
      selectedTable?._id ? String(selectedTable._id) : '';

    if(!tid) return;

    const relevantKots =
      (kots || []).filter((k) => (
        String(k?.table || '') === tid &&
        k?.isBilled === false
      ));

    // Merge items (name + price + gst)
    const merged = new Map();

    for(const kot of relevantKots){
      for(const it of (kot?.items || [])){
        const name = String(it?.name || '').trim();
        const price = Number(it?.price || 0);
        const gst = Number(it?.gst ?? 0);
        const qty = Number(it?.quantity || 0);
        if(!name || qty <= 0) continue;

        const key = `${name}@@${price}@@${gst}`;
        const prev = merged.get(key);
        if(prev){
          merged.set(
            key,
            {
              ...prev,
              qty: prev.qty + qty
            }
          );
        }
        else{
          merged.set(
            key,
            {
              name,
              price,
              gst,
              qty
            }
          );
        }
      }
    }

    const nextItems =
      Array.from(merged.values())
        .sort((a,b) => a.name.localeCompare(b.name));

    setServerBillItems(nextItems);
  },[kots, selectedTable]);

  useEffect(() => {
    // Reset manual overrides when switching tables
    if(!selectedTable?._id){
      setBillOverrides({});
      setBillDraftLoaded(false);
      return;
    }

    setBillOverrides({});
    setBillDraftLoaded(false);
  },[selectedTable?._id]);

  const toDraftItems = (items) => (
    (Array.isArray(items) ? items : [])
      .map((it) => ({
        name:String(it?.name || '').trim(),
        quantity:Math.max(1,Number(it?.qty || it?.quantity || 1)),
        price:Number(it?.price || 0),
        gst:Number(it?.gst ?? 0)
      }))
      .filter((it) => it.name)
  );

  const makeKey = (item) => {
    const name = String(item?.name || '').trim();
    const price = Number(item?.price || 0);
    const gst = Number(item?.gst ?? 0);
    return `${name}@@${price}@@${gst}`;
  };

  const billItems = useMemo(() => {
    const base = Array.isArray(serverBillItems) ? serverBillItems : [];
    const overrides = billOverrides && typeof billOverrides === 'object' ? billOverrides : {};

    const map = new Map();
    for(const it of base){
      const key = makeKey(it);
      map.set(key,{ ...it });
    }

    for(const [key,ov] of Object.entries(overrides)){
      if(!ov) continue;
      if(ov.removed){
        map.delete(key);
        continue;
      }

      const name = String(ov.name || '').trim();
      const price = Number(ov.price || 0);
      const gst = Number(ov.gst ?? 0);
      const serverQty = Number(map.get(key)?.qty || 0);
      const delta = Number(ov.deltaQty || 0);
      const nextQty = Math.max(1, serverQty + delta);

      if(map.has(key)){
        map.set(key,{
          ...map.get(key),
          qty: nextQty
        });
      }
      else{
        // Manual-only item
        map.set(key,{
          name,
          price,
          gst,
          qty: Math.max(1,delta)
        });
      }
    }

    return Array.from(map.values())
      .filter((x) => x && String(x.name || '').trim())
      .sort((a,b) => String(a.name).localeCompare(String(b.name)));
  },[serverBillItems,billOverrides]);

  const loadBillDraft = async (tableId) => {
    const res = await fetch(
      `${API_URL}/api/table/bill-draft/${encodeURIComponent(String(tableId))}`,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    const data = await res.json();
    if(!res.ok || !data?.success){
      throw new Error(data?.message || 'Failed to load bill draft');
    }

    const items =
      Array.isArray(data?.billDraftItems)
        ? data.billDraftItems
        : [];

    // Convert draft items to overrides relative to serverBillItems
    const overrides = {};

    for(const it of items){
      const name = String(it?.name || '').trim();
      const price = Number(it?.price || 0);
      const gst = Number(it?.gst ?? 0);
      const quantity = Math.max(1,Number(it?.quantity || 1));
      if(!name) continue;

      const key = `${name}@@${price}@@${gst}`;

      const serverItem =
        (Array.isArray(serverBillItems) ? serverBillItems : [])
          .find((s) => makeKey(s) === key);

      const serverQty =
        Number(serverItem?.qty || 0);

      overrides[key] = {
        name,
        price,
        gst,
        removed:false,
        deltaQty: quantity - serverQty
      };
    }

    setBillOverrides(overrides);
    setBillDraftLoaded(true);
  };

  const saveBillDraft = async (tableId, items) => {
    await fetch(
      `${API_URL}/api/table/bill-draft/${encodeURIComponent(String(tableId))}`,
      {
        method:'PUT',
        headers:{
          'Content-Type':'application/json',
          Authorization:`Bearer ${token}`
        },
        body:JSON.stringify({
          items
        })
      }
    );
  };

  useEffect(() => {
    if(!token) return;
    if(!selectedTable?._id) return;
    if(billDraftLoaded) return;

    loadBillDraft(selectedTable._id)
      .catch(() => {
        setBillDraftLoaded(true);
      });
  },[token, selectedTable?._id, billDraftLoaded, serverBillItems]);

  useEffect(() => {
    if(!token) return;
    if(!selectedTable?._id) return;

    const id = setTimeout(() => {
      const itemsToSave = toDraftItems(billItems);
      saveBillDraft(selectedTable._id, itemsToSave)
        .catch(() => {});
    },800);

    return () => clearTimeout(id);
  },[token, selectedTable?._id, billItems]);

  const activeKotTableCodes = useMemo(() => {
    const active = new Set();

    for(const k of (kots || [])){
      if(!k?.status || k.status === 'COMPLETED') continue;
      const code = String(k.tableCode || '').trim();
      if(code) active.add(code);

      const num =
        k?.tableNumber != null
          ? String(k.tableNumber)
          : '';

      if(num){
        active.add(`T-${num}`);
      }
    }

    return active;
  },[kots]);

  const tablesBySection = useMemo(() => {

    const map = new Map();

    for(const meta of SECTION_META){
      map.set(meta.key,[]);
    }

    for(const t of (tables || [])){
      const key = t.section;
      if(!map.has(key)){
        map.set(key,[]);
      }
      map.get(key).push(t);
    }

    for(const [key,list] of map.entries()){
      list.sort(
        (a,b) => Number(a.tableNumber) - Number(b.tableNumber)
      );
      map.set(key,list);
    }

    return map;
  },[tables]);

  const selectedTables = useMemo(() => (
    tablesBySection.get(selectedSection) || []
  ),[tablesBySection,selectedSection]);

  const stats = useMemo(() => {

    const counts = {
      blank:0,
      running:0,
      printed:0,
      kot:0
    };

    for(const t of (tables || [])){
      const key =
        String(t.code || `T-${t.tableNumber}`);
      const hasKot =
        activeKotTableCodes.has(key);

      if(hasKot) counts.kot += 1;
      if(t.status === 'AVAILABLE' && !hasKot) counts.blank += 1;
      if(t.status === 'RUNNING' || t.status === 'OCCUPIED') counts.running += 1;
      if(t.status === 'BILLING') counts.printed += 1;
    }

    return counts;
  },[tables,activeKotTableCodes]);

  const getTableLabel = (table) => {
    const meta =
      SECTION_META.find((s) => s.key === table.section);
    const prefix = meta?.prefix || 'T';
    return `${prefix}-${table.tableNumber}`;
  };

  const selectedCaptainName = useMemo(() => {
    const nameFromTable =
      selectedTable?.activeCaptain?.name ||
      selectedTable?.activeCaptainName ||
      '';

    if(nameFromTable) return String(nameFromTable);

    const tid =
      selectedTable?._id ? String(selectedTable._id) : '';

    const firstKot =
      tid
        ? (kots || []).find((k) => String(k?.table || '') === tid && k?.isBilled === false)
        : null;

    return String(firstKot?.captain?.name || '').trim();
  },[selectedTable,kots]);

  const getTableClass = (table) => {
    const base = ['tv-table-card'];

    const key =
      String(
        table.code ||
        `T-${table.tableNumber}`
      );

    const hasActiveKot =
      activeKotTableCodes.has(key);

    if(hasActiveKot){
      base.push('is-kot');
    }
    else if(table.status === 'RUNNING' || table.status === 'OCCUPIED'){
      base.push('is-running');
    }
    if(table.status === 'BILLING') base.push('is-billing');
    if(table.status === 'AVAILABLE' && !hasActiveKot) base.push('is-available');

    if(hasActiveKot){
      base.push('has-kot');
    }

    return base.join(' ');
  };

  const computedSubtotal = useMemo(() => (
    (billItems || []).reduce((acc, i) => {
      const line =
        Number(i?.price || 0) * Number(i?.qty || 0);
      return acc + line;
    }, 0)
  ),[billItems]);

  const computedGst = useMemo(() => (
    (billItems || []).reduce((acc, i) => {
      const line =
        Number(i?.price || 0) * Number(i?.qty || 0);
      const gst = Number(i?.gst ?? 0);
      return acc + (line * gst / 100);
    }, 0)
  ),[billItems]);

  const computedTotal = useMemo(() => (
    computedSubtotal + computedGst
  ),[computedSubtotal,computedGst]);

  // Keep billNo stable for a selected table (avoid recalculating on re-render)
  const [stableBillNo,setStableBillNo] = useState('');
  useEffect(() => {
    if(!selectedTable?._id){
      setStableBillNo('');
      return;
    }
    setStableBillNo(`BILL-${Date.now().toString(36).toUpperCase()}`);
  },[selectedTable?._id]);

  const paymentOptions = [
    { id: 'CASH', label: 'Cash Payment', icon: 'fa-solid fa-wallet' },
    { id: 'UPI', label: 'UPI Payment', icon: 'fa-solid fa-mobile-screen-button' },
    { id: 'CARD', label: 'Card Payment', icon: 'fa-solid fa-credit-card' },
    { id: 'SPLIT', label: 'Split Payment', icon: 'fa-solid fa-layer-group' },
  ];

  const requestPaymentMethod = (method) => {
    if(isLoading) return;
    if(method === paymentMethod) return;
    setPaymentMethod(method);
  };

  const onRemoveItem = (idx) => {
    const item = billItems[idx];
    if(!item) return;
    const key = makeKey(item);
    setBillOverrides((prev) => ({
      ...(prev || {}),
      [key]:{
        ...(prev?.[key] || {}),
        name:item.name,
        price:item.price,
        gst:item.gst,
        removed:true
      }
    }));
  };

  const onChangeQty = (idx, nextQty) => {
    const item = billItems[idx];
    if(!item) return;

    const key = makeKey(item);
    const baseKey = makeKey(item);

    const serverItem =
      (Array.isArray(serverBillItems) ? serverBillItems : [])
        .find((it) => makeKey(it) === baseKey);

    const serverQty =
      Number(serverItem?.qty || 0);

    const desiredQty =
      Math.max(1, Number(nextQty || 1));

    const deltaQty =
      desiredQty - serverQty;

    setBillOverrides((prev) => ({
      ...(prev || {}),
      [key]:{
        ...(prev?.[key] || {}),
        name:item.name,
        price:item.price,
        gst:item.gst,
        removed:false,
        deltaQty
      }
    }));
  };

  const [newItem,setNewItem] = useState({
    name:'',
    qty:1,
    price:0,
    gst:0
  });

  const addMenuItemToBill = (menu) => {
    const name = String(menu?.name || '').trim();
    const price = Number(menu?.price || 0);
    const gst = Number(menu?.gst ?? 0);
    if(!name) return;

    const key = `${name}@@${price}@@${gst}`;

    const serverItem =
      (Array.isArray(serverBillItems) ? serverBillItems : [])
        .find((it) => makeKey(it) === key);

    const serverQty =
      Number(serverItem?.qty || 0);

    const existingDelta =
      Number(billOverrides?.[key]?.deltaQty || 0);

    setBillOverrides((prev) => ({
      ...(prev || {}),
      [key]:{
        name,
        price,
        gst,
        removed:false,
        deltaQty: (serverQty + existingDelta <= 0 ? 1 : existingDelta + 1)
      }
    }));

    setMenuQuery('');
    setIsAddItemOpen(false);
  };

  const addNewItem = () => {
    const name = String(newItem?.name || '').trim();
    const qty = Number(newItem?.qty || 0);
    const price = Number(newItem?.price || 0);
    const gst = Number(newItem?.gst ?? 0);

    if(!name){
      alert('Item name is required');
      return;
    }
    if(qty <= 0){
      alert('Qty must be greater than 0');
      return;
    }

    const key = `${name}@@${price}@@${gst}`;

    const serverItem =
      (Array.isArray(serverBillItems) ? serverBillItems : [])
        .find((it) => makeKey(it) === key);

    const serverQty =
      Number(serverItem?.qty || 0);

    setBillOverrides((prev) => ({
      ...(prev || {}),
      [key]:{
        name,
        price,
        gst,
        removed:false,
        deltaQty: (qty - serverQty)
      }
    }));

    setNewItem({
      name:'',
      qty:1,
      price:0,
      gst:0
    });

    setIsAddItemOpen(false);
  };

  const groupedMenus = useMemo(() => {
    const q = String(menuQuery || '').trim().toLowerCase();
    const list = (menus || [])
      .filter((m) => !!m && !!m._id)
      .filter((m) => {
        if(!q) return true;
        const name = String(m.name || '').toLowerCase();
        const category = String(m.category || '').toLowerCase();
        return name.includes(q) || category.includes(q);
      })
      .sort((a,b) => {
        const catA = String(a.category || '').localeCompare(String(b.category || ''));
        if(catA !== 0) return catA;
        return String(a.name || '').localeCompare(String(b.name || ''));
      });

    const map = new Map();
    for(const m of list){
      const cat = String(m.category || 'Other').trim() || 'Other';
      if(!map.has(cat)) map.set(cat,[]);
      map.get(cat).push(m);
    }

    return Array.from(map.entries());
  },[menus,menuQuery]);

  const confirmPayment = async () => {
    if(!selectedTable?._id){
      alert('Table not found');
      return;
    }

    if(!Array.isArray(billItems) || billItems.length === 0){
      alert('No items');
      return;
    }

    if(!paymentMethod){
      alert('Select payment method');
      return;
    }

    setIsLoading(true);
    try{
      const res = await fetch(
        `${API_URL}/api/bill/create-from-table`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${token}`
          },
          body: JSON.stringify({
            tableId:String(selectedTable._id),
            paymentMethod:String(paymentMethod || '').toUpperCase(),
            items: billItems.map((it) => ({
              name: it.name,
              quantity: Number(it.qty || 0),
              price: Number(it.price || 0),
              gst: Number(it.gst ?? 0)
            }))
          })
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(data?.message || 'Failed to confirm payment');
      }

      alert('Payment completed & bill saved');
      setIsPayConfirmOpen(false);
      setSelectedTable(null);
      await Promise.all([fetchTables(),fetchKots()]);
    }
    catch(error){
      alert(error.message);
    }
    finally{
      setIsLoading(false);
    }
  };

  const printBillOnly = () => {
    if(!selectedTable) return;

    const safe = (v) =>
      String(v ?? '')
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'",'&#039;');

    const rows = (billItems || []).map((it) => {
      const qty = Number(it?.qty || 0);
      const price = Number(it?.price || 0);
      const total = qty * price;
      return `
        <tr>
          <td>${safe(it?.name || '')}</td>
          <td style="text-align:center;">${qty}</td>
          <td style="text-align:right;">₹${price}</td>
          <td style="text-align:right;">₹${total}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${safe(stableBillNo || 'Bill')}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            html, body { padding: 0; margin: 0; }
            body { font-family: Arial, sans-serif; color:#0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .card { width: 72mm; margin: 0 auto; }
            .restaurant { text-align:center; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
            .restaurant h2 { margin:0; font-size:20px; }
            .restaurant p { margin:2px 0; color:#475569; font-size:12px; }
            .meta { margin: 14px 0 10px; font-size: 12px; }
            .meta-row { display:flex; justify-content:space-between; gap: 12px; margin-bottom: 6px; }
            .meta b { color:#0f172a; }
            table { width:100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
            th { text-align:left; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
            td { border-bottom: 1px solid #f1f5f9; padding: 8px 0; }
            .summary { margin-top: 12px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 12px; }
            .sum-row { display:flex; justify-content:space-between; margin: 6px 0; color:#475569; }
            .grand { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 16px; font-weight: 800; color:#0f172a; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="restaurant">
              <h2>DINEZY RESTAURANT</h2>
              <p>123 Main Street, City - 400001</p>
              <p>Phone: +91 98765 43210</p>
              <p>GSTIN: 27XXXXX1234X1ZX</p>
            </div>
            <div class="meta">
              <div class="meta-row"><span>Bill No: <b>${safe(stableBillNo)}</b></span><span>Date &amp; Time: <b>${safe(formatDateTime(new Date()))}</b></span></div>
              <div class="meta-row"><span>Table: <b>${safe(getTableLabel(selectedTable))}</b></span><span>Captain: <b>${safe(selectedCaptainName || '-')}</b></span></div>
              <div class="meta-row"><span>Payment: <b>${safe(paymentOptions.find((p) => p.id === paymentMethod)?.label || paymentMethod || '-')}</b></span></div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align:center;">Qty</th>
                  <th style="text-align:right;">Price</th>
                  <th style="text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan=\"4\" style=\"text-align:center;color:#64748b;padding:14px 0;\">No items</td></tr>'}
              </tbody>
            </table>
            <div class="summary">
              <div class="sum-row"><span>Subtotal</span><b>₹${Number(computedSubtotal || 0).toFixed(2)}</b></div>
              <div class="sum-row"><span>GST</span><b>₹${Number(computedGst || 0).toFixed(2)}</b></div>
              <div class="sum-row grand"><span>Grand Total</span><span>₹${Number(computedTotal || 0).toFixed(2)}</span></div>
            </div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden','true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';

    const cleanup = () => {
      try{ iframe.remove(); } catch{}
    };

    iframe.onload = () => {
      try{
        const w = iframe.contentWindow;
        if(!w){
          cleanup();
          alert('Unable to open print preview.');
          return;
        }

        w.focus();
        // Allow layout to settle before printing.
        setTimeout(() => {
          try{ w.print(); } catch{}
          cleanup();
        }, 150);
      }
      catch{
        cleanup();
        alert('Unable to open print preview.');
      }
    };

    // Use srcdoc to avoid popups and still print only the bill.
    iframe.srcdoc = html;
    document.body.appendChild(iframe);
  };

  const renderBillPanel = () => {
    if(!selectedTable) return null;

    return (
      <aside className="bill-panel">
        <div className="bill-panel-header">
          <div>
            <p className="bill-panel-kicker">BILL PREVIEW</p>
            <h2>{getTableLabel(selectedTable)}</h2>
          </div>
          <div className="bill-panel-actions">
            <button
              className="bill-panel-btn ghost"
              onClick={() => {
                if(isLoading) return;
                setSelectedTable(null);
              }}
              disabled={isLoading}
            >
              Close
            </button>
          </div>
        </div>

        <div className="bill-preview-card">
          <div className="restaurant-info">
            <h3>DINEZY RESTAURANT</h3>
            <p>123 Main Street, City - 400001</p>
            <p>Phone: +91 98765 43210</p>
            <p>GSTIN: 27XXXXX1234X1ZX</p>
          </div>

          <div className="bill-meta">
            <div className="bill-meta-row">
              <span>Bill No:</span>
              <strong>{stableBillNo}</strong>
            </div>
            <div className="bill-meta-row">
              <span>Date & Time:</span>
              <strong>{formatDateTime(new Date())}</strong>
            </div>
            <div className="bill-meta-row">
              <span>Table:</span>
              <strong>{getTableLabel(selectedTable)}</strong>
            </div>
            <div className="bill-meta-row">
              <span>Captain:</span>
              <strong>{selectedCaptainName || '-'}</strong>
            </div>
          </div>

          <table className="bill-items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((it, idx) => (
                <tr key={`${it.name}:${it.price}:${idx}`}>
                  <td>{it.name}</td>
                  <td className="text-center">
                    <input
                      className="qty-input"
                      type="number"
                      min={1}
                      value={it.qty}
                      onChange={(e) => onChangeQty(idx, e.target.value)}
                      disabled={isLoading}
                    />
                  </td>
                  <td className="text-right">₹{Number(it.price || 0)}</td>
                  <td className="text-right">₹{Number(it.price || 0) * Number(it.qty || 0)}</td>
                  <td className="text-right">
                    <button
                      className="mini-btn danger"
                      onClick={() => onRemoveItem(idx)}
                      disabled={isLoading}
                      aria-label="Remove item"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}

              {billItems.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', fontWeight: 700, padding: '16px 0' }}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="bill-add-dropdown">
            <button
              type="button"
              className="bill-add-toggle"
              onClick={() => setIsAddItemOpen((v) => !v)}
              disabled={isLoading}
              aria-expanded={isAddItemOpen}
            >
              <span><i className="fa-solid fa-plus"></i> Add Item</span>
              <i className={`fa-solid ${isAddItemOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            </button>

            {isAddItemOpen && (
              <div className="bill-add-panel">
                <div className="bill-menu-search">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input
                    className="bill-menu-search-input"
                    placeholder="Search item..."
                    value={menuQuery}
                    onChange={(e) => setMenuQuery(e.target.value)}
                    disabled={isLoading || isMenuLoading}
                    autoFocus
                  />
                </div>

                <div className="bill-menu-list" role="listbox" aria-label="Menu items">
                  {isMenuLoading && (
                    <div className="bill-menu-empty">Loading menu...</div>
                  )}

                  {!isMenuLoading && groupedMenus.length === 0 && (
                    <div className="bill-menu-empty">No items found</div>
                  )}

                  {!isMenuLoading && groupedMenus.map(([cat,items]) => (
                    <div key={cat} className="bill-menu-group">
                      <div className="bill-menu-group-title">{cat}</div>
                      <div className="bill-menu-group-items">
                        {items.map((m) => (
                          <button
                            key={m._id}
                            type="button"
                            className="bill-menu-item"
                            onClick={() => addMenuItemToBill(m)}
                            disabled={isLoading}
                          >
                            <span className="bill-menu-item-name">{m.name}</span>
                            <span className="bill-menu-item-meta">
                              ₹{Number(m.price || 0)}{Number(m.gst ?? 0) ? ` • ${Number(m.gst)}% GST` : ''}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bill-summary">
            <div className="bill-summary-row">
              <span>Sub Total</span>
              <strong>₹{Number(computedSubTotal || 0).toFixed(2)}</strong>
            </div>
            <div className="bill-summary-row">
              <span>GST</span>
              <strong>₹{Number(computedGstTotal || 0).toFixed(2)}</strong>
            </div>
            <div className="bill-summary-row total">
              <span>Total</span>
              <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
            </div>
          </div>

          <div className="bill-panel-bottom">
            <button
              className="bill-panel-btn ghost"
              onClick={handlePrintBill}
              disabled={isLoading}
            >
              <i className="fa-solid fa-print"></i> Print Bill
            </button>

            <button
              className="bill-panel-btn primary"
              onClick={createBill}
              disabled={isLoading || billItems.length === 0}
            >
              <i className="fa-solid fa-receipt"></i> Generate Bill
            </button>
          </div>

          <div className="bill-payment-methods">
            <h4>Select Payment Method</h4>
            <div className="payment-options-inline">
              <button
                type="button"
                className={paymentMethod === 'CASH' ? 'pay-option-inline active' : 'pay-option-inline'}
                onClick={() => setPaymentMethod('CASH')}
                disabled={isLoading}
              >
                <i className="fa-solid fa-money-bill-wave"></i>
                Cash
              </button>
              <button
                type="button"
                className={paymentMethod === 'CARD' ? 'pay-option-inline active' : 'pay-option-inline'}
                onClick={() => setPaymentMethod('CARD')}
                disabled={isLoading}
              >
                <i className="fa-solid fa-credit-card"></i>
                Card
              </button>
              <button
                type="button"
                className={paymentMethod === 'UPI' ? 'pay-option-inline active' : 'pay-option-inline'}
                onClick={() => setPaymentMethod('UPI')}
                disabled={isLoading}
              >
                <i className="fa-solid fa-qrcode"></i>
                UPI
              </button>
              <button
                type="button"
                className={paymentMethod === 'OTHER' ? 'pay-option-inline active' : 'pay-option-inline'}
                onClick={() => setPaymentMethod('OTHER')}
                disabled={isLoading}
              >
                <i className="fa-solid fa-ellipsis"></i>
                Other
              </button>
            </div>
          </div>

          <button
            className="pay-confirm-open"
            onClick={() => setIsPayConfirmOpen(true)}
            disabled={isLoading || !paymentMethod || billItems.length === 0}
          >
            <i className="fa-solid fa-circle-check"></i> Confirm Payment
          </button>

          {isPayConfirmOpen && (
            <div className="pay-confirm-overlay" role="dialog" aria-modal="true">
              <div className="pay-confirm-modal">
                <div className="pay-confirm-header">
                  <h3>Confirm Payment</h3>
                  <button
                    className="pay-confirm-close"
                    onClick={() => setIsPayConfirmOpen(false)}
                    disabled={isLoading}
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>

                <div className="pay-confirm-body">
                  <div className="pay-confirm-row">
                    <span>Table</span>
                    <strong>{getTableLabel(selectedTable)}</strong>
                  </div>
                  <div className="pay-confirm-row">
                    <span>Method</span>
                    <strong>{paymentMethod || '-'}</strong>
                  </div>
                  <div className="pay-confirm-total">
                    <span>Amount</span>
                    <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="pay-confirm-actions">
                  <button
                    className="pay-confirm-cancel"
                    onClick={() => setIsPayConfirmOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="pay-confirm-ok"
                    onClick={confirmPayment}
                    disabled={isLoading || !paymentMethod}
                  >
                    Payment Complete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    );
  };

  const content = (
    <div className={withSidebar ? 'table-view-container table-view-embed' : 'table-view-container'}>
      <div className="table-view-inner">
      {/* Top Header Section */}
      <header className="table-header">
        <div className="header-left">
          <p className="floor-plan-text">FLOOR PLAN</p>
          <h1>Table View</h1>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => {
              if(isLoading) return;
              setIsLoading(true);
              Promise.all([fetchTables(),fetchKots()])
                .catch(() => {})
                .finally(() => setIsLoading(false));
            }}
            disabled={isLoading}
            aria-label="Refresh"
          >
            <i className="fa-solid fa-rotate"></i>
          </button>
          <button className="add-table-btn"><i className="fa-solid fa-plus"></i> Add Table</button>
          <button className="nav-btn">Delivery</button>
          <button className="nav-btn">Pick Up</button>
        </div>
      </header>

      {/* Legend & Stats */}
      <div className="table-meta">
        <div className="legend">
          <span><i className="fa-solid fa-square blank"></i> Blank Table</span>
          <span><i className="fa-solid fa-square running"></i> Running Table</span>
          <span><i className="fa-solid fa-square printed"></i> Printed / Free</span>
          <span><i className="fa-solid fa-square kot"></i> Running KOT</span>
        </div>
        <div className="stats">
          <span>Blank {stats.blank}</span> • <span>Running {stats.running}</span> • <span>Running KOT {stats.kot}</span> • <span>Printed / Free {stats.printed}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="table-sections">
        {SECTION_META.map((s) => (
          <button
            key={s.key}
            className={selectedSection === s.key ? 'section-tab active' : 'section-tab'}
            onClick={() => setSelectedSection(s.key)}
            disabled={isLoading}
          >
            Section {s.label}
            <span className="tab-count">
              {(tablesBySection.get(s.key) || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Tables */}
      <div className="section-block">
        <div className="section-title">
          <i className="fa-solid fa-border-all"></i>
          <h3>
            Section {SECTION_META.find((s) => s.key === selectedSection)?.label || selectedSection}
          </h3>
          <span className="table-count">{selectedTables.length} TABLES</span>
        </div>

        {selectedTable && !isCompactLayout && (
          <div className="bill-desktop-sticky" role="region" aria-label="Bill Preview">
            <aside className="bill-panel">
              <div className="bill-panel-header">
                <div>
                  <p className="bill-panel-kicker">BILL PREVIEW</p>
                  <h2>{getTableLabel(selectedTable)}</h2>
                </div>
                <div className="bill-panel-actions">
                  <button
                    className="bill-panel-btn ghost"
                    onClick={() => {
                      if(isLoading) return;
                      setSelectedTable(null);
                    }}
                    disabled={isLoading}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="bill-preview-card">
                <div className="restaurant-info">
                  <h3>DINEZY RESTAURANT</h3>
                  <p>123 Main Street, City - 400001</p>
                  <p>Phone: +91 98765 43210</p>
                  <p>GSTIN: 27XXXXX1234X1ZX</p>
                </div>

                <div className="bill-meta">
                  <div className="bill-meta-row">
                    <span>Bill No:</span>
                    <strong>{stableBillNo}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Date & Time:</span>
                    <strong>{formatDateTime(new Date())}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Table:</span>
                    <strong>{getTableLabel(selectedTable)}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Captain:</span>
                    <strong>{selectedCaptainName || '-'}</strong>
                  </div>
                </div>

                <table className="bill-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((it, idx) => (
                      <tr key={`${it.name}:${it.price}:${idx}`}>
                        <td>{it.name}</td>
                        <td className="text-center">
                          <input
                            className="qty-input"
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => onChangeQty(idx, e.target.value)}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="text-right">₹{Number(it.price || 0)}</td>
                        <td className="text-right">₹{Number(it.price || 0) * Number(it.qty || 0)}</td>
                        <td className="text-right">
                          <button
                            className="mini-btn danger"
                            onClick={() => onRemoveItem(idx)}
                            disabled={isLoading}
                            aria-label="Remove item"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', fontWeight: 700, padding: '16px 0' }}>
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="bill-add-dropdown">
                  <button
                    type="button"
                    className="bill-add-toggle"
                    onClick={() => setIsAddItemOpen((v) => !v)}
                    disabled={isLoading}
                    aria-expanded={isAddItemOpen}
                  >
                    <span><i className="fa-solid fa-plus"></i> Add Item</span>
                    <i className={`fa-solid ${isAddItemOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>

                  {isAddItemOpen && (
                    <div className="bill-add-panel">
                      <div className="bill-menu-search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                          className="bill-menu-search-input"
                          placeholder="Search item..."
                          value={menuQuery}
                          onChange={(e) => setMenuQuery(e.target.value)}
                          disabled={isLoading || isMenuLoading}
                          autoFocus
                        />
                      </div>

                      <div className="bill-menu-list" role="listbox" aria-label="Menu items">
                        {isMenuLoading && (
                          <div className="bill-menu-empty">Loading menu...</div>
                        )}

                        {!isMenuLoading && groupedMenus.length === 0 && (
                          <div className="bill-menu-empty">No items found</div>
                        )}

                        {!isMenuLoading && groupedMenus.map(([cat,items]) => (
                          <div key={cat} className="bill-menu-group">
                            <div className="bill-menu-group-title">{cat}</div>
                            <div className="bill-menu-group-items">
                              {items.map((m) => (
                                <button
                                  key={m._id}
                                  type="button"
                                  className="bill-menu-item"
                                  onClick={() => addMenuItemToBill(m)}
                                  disabled={isLoading}
                                >
                                  <span className="bill-menu-item-name">{m.name}</span>
                                  <span className="bill-menu-item-meta">
                                    ₹{Number(m.price || 0)}{Number(m.gst ?? 0) ? ` • ${Number(m.gst)}% GST` : ''}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bill-summary">
                  <div className="bill-summary-row">
                    <span>Sub Total</span>
                    <strong>₹{Number(computedSubTotal || 0).toFixed(2)}</strong>
                  </div>
                  <div className="bill-summary-row">
                    <span>GST</span>
                    <strong>₹{Number(computedGstTotal || 0).toFixed(2)}</strong>
                  </div>
                  <div className="bill-summary-row total">
                    <span>Total</span>
                    <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="bill-panel-bottom">
                  <button
                    className="bill-panel-btn ghost"
                    onClick={handlePrintBill}
                    disabled={isLoading}
                  >
                    <i className="fa-solid fa-print"></i> Print Bill
                  </button>

                  <button
                    className="bill-panel-btn primary"
                    onClick={createBill}
                    disabled={isLoading || billItems.length === 0}
                  >
                    <i className="fa-solid fa-receipt"></i> Generate Bill
                  </button>
                </div>

                <div className="bill-payment-methods">
                  <h4>Select Payment Method</h4>
                  <div className="payment-options-inline">
                    <button
                      type="button"
                      className={paymentMethod === 'CASH' ? 'pay-option-inline active' : 'pay-option-inline'}
                      onClick={() => setPaymentMethod('CASH')}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-money-bill-wave"></i>
                      Cash
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === 'CARD' ? 'pay-option-inline active' : 'pay-option-inline'}
                      onClick={() => setPaymentMethod('CARD')}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-credit-card"></i>
                      Card
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === 'UPI' ? 'pay-option-inline active' : 'pay-option-inline'}
                      onClick={() => setPaymentMethod('UPI')}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-qrcode"></i>
                      UPI
                    </button>
                    <button
                      type="button"
                      className={paymentMethod === 'OTHER' ? 'pay-option-inline active' : 'pay-option-inline'}
                      onClick={() => setPaymentMethod('OTHER')}
                      disabled={isLoading}
                    >
                      <i className="fa-solid fa-ellipsis"></i>
                      Other
                    </button>
                  </div>
                </div>

                <button
                  className="pay-confirm-open"
                  onClick={() => setIsPayConfirmOpen(true)}
                  disabled={isLoading || !paymentMethod || billItems.length === 0}
                >
                  <i className="fa-solid fa-circle-check"></i> Confirm Payment
                </button>

                {isPayConfirmOpen && (
                  <div className="pay-confirm-overlay" role="dialog" aria-modal="true">
                    <div className="pay-confirm-modal">
                      <div className="pay-confirm-header">
                        <h3>Confirm Payment</h3>
                        <button
                          className="pay-confirm-close"
                          onClick={() => setIsPayConfirmOpen(false)}
                          disabled={isLoading}
                          aria-label="Close"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>

                      <div className="pay-confirm-body">
                        <div className="pay-confirm-row">
                          <span>Table</span>
                          <strong>{getTableLabel(selectedTable)}</strong>
                        </div>
                        <div className="pay-confirm-row">
                          <span>Method</span>
                          <strong>{paymentMethod || '-'}</strong>
                        </div>
                        <div className="pay-confirm-total">
                          <span>Amount</span>
                          <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
                        </div>
                      </div>

                      <div className="pay-confirm-actions">
                        <button
                          className="pay-confirm-cancel"
                          onClick={() => setIsPayConfirmOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                        <button
                          className="pay-confirm-ok"
                          onClick={confirmPayment}
                          disabled={isLoading || !paymentMethod}
                        >
                          Payment Complete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        <div className="table-view-split">
          <div>
            {!token ? (
              <div className="table-empty-state">
                <div className="title">Login required</div>
                <div className="desc">Please login as Manager to view tables.</div>
              </div>
            ) : loadError ? (
              <div className="table-empty-state">
                <div className="title">Could not load tables</div>
                <div className="desc">{loadError}</div>
                <button
                  className="nav-btn"
                  onClick={() => {
                    fetchTables().catch(() => {});
                    fetchKots().catch(() => {});
                  }}
                  disabled={isLoading}
                >
                  Retry
                </button>
              </div>
            ) : selectedTables.length === 0 ? (
              <div className="table-empty-state">
                <div className="title">No tables found</div>
                <div className="desc">Seed tables from the server or add tables from Owner/Manager tools.</div>
              </div>
            ) : (
              <div className="tables-grid">
                {selectedTables.map((table) => (
                  <div
                    key={table._id}
                    className={`${getTableClass(table)} ${selectedTable?._id === table._id ? 'is-selected' : ''}`}
                    onClick={() => setSelectedTable(table)}
                  >
                    <div className="card-actions">
                      <i className="fa-solid fa-pen edit"></i>
                      <i className="fa-solid fa-trash delete"></i>
                    </div>
                    <div className="table-info">
                      <h2>{getTableLabel(table)}</h2>
                      <p>Cap. {table.capacity}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedTable && isCompactLayout && (
            <div
              className="bill-modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-label="Bill Preview"
              onClick={() => {
                if(isLoading) return;
                setSelectedTable(null);
              }}
            >
              <div
                className="bill-modal bill-modal-animate"
                onClick={(e) => e.stopPropagation()}
              >
                <aside className="bill-panel">
              <div className="bill-panel-header">
                <div>
                  <p className="bill-panel-kicker">BILL PREVIEW</p>
                  <h2>{getTableLabel(selectedTable)}</h2>
                </div>
                <div className="bill-panel-actions">
                  <button
                    className="bill-panel-btn ghost"
                    onClick={() => {
                      if(isLoading) return;
                      setSelectedTable(null);
                    }}
                    disabled={isLoading}
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="bill-preview-card">
                <div className="restaurant-info">
                  <h3>DINEZY RESTAURANT</h3>
                  <p>123 Main Street, City - 400001</p>
                  <p>Phone: +91 98765 43210</p>
                  <p>GSTIN: 27XXXXX1234X1ZX</p>
                </div>

                <div className="bill-meta">
                  <div className="bill-meta-row">
                    <span>Bill No:</span>
                    <strong>{stableBillNo}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Date & Time:</span>
                    <strong>{formatDateTime(new Date())}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Table:</span>
                    <strong>{getTableLabel(selectedTable)}</strong>
                  </div>
                  <div className="bill-meta-row">
                    <span>Captain:</span>
                    <strong>{selectedCaptainName || '-'}</strong>
                  </div>
                </div>

                <table className="bill-items-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="text-center">Qty</th>
                      <th className="text-right">Price</th>
                      <th className="text-right">Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((it, idx) => (
                      <tr key={`${it.name}:${it.price}:${idx}`}>
                        <td>{it.name}</td>
                        <td className="text-center">
                          <input
                            className="qty-input"
                            type="number"
                            min={1}
                            value={it.qty}
                            onChange={(e) => onChangeQty(idx, e.target.value)}
                            disabled={isLoading}
                          />
                        </td>
                        <td className="text-right">₹{Number(it.price || 0)}</td>
                        <td className="text-right">₹{Number(it.price || 0) * Number(it.qty || 0)}</td>
                        <td className="text-right">
                          <button
                            className="mini-btn danger"
                            onClick={() => onRemoveItem(idx)}
                            disabled={isLoading}
                            aria-label="Remove item"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}

                    {billItems.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign:'center', color:'#94a3b8', fontWeight: 700, padding: '16px 0' }}>
                          No items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="bill-add-dropdown">
                  <button
                    type="button"
                    className="bill-add-toggle"
                    onClick={() => setIsAddItemOpen((v) => !v)}
                    disabled={isLoading}
                    aria-expanded={isAddItemOpen}
                  >
                    <span><i className="fa-solid fa-plus"></i> Add Item</span>
                    <i className={`fa-solid ${isAddItemOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                  </button>

                  {isAddItemOpen && (
                    <div className="bill-add-panel">
                      <div className="bill-menu-search">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input
                          className="bill-menu-search-input"
                          placeholder="Search item..."
                          value={menuQuery}
                          onChange={(e) => setMenuQuery(e.target.value)}
                          disabled={isLoading || isMenuLoading}
                          autoFocus
                        />
                      </div>

                      <div className="bill-menu-list" role="listbox" aria-label="Menu items">
                        {isMenuLoading && (
                          <div className="bill-menu-empty">Loading menu...</div>
                        )}

                        {!isMenuLoading && groupedMenus.length === 0 && (
                          <div className="bill-menu-empty">No items found</div>
                        )}

                        {!isMenuLoading && groupedMenus.map(([cat,items]) => (
                          <div key={cat} className="bill-menu-group">
                            <div className="bill-menu-group-title">{cat}</div>
                            <div className="bill-menu-group-items">
                              {items.map((m) => (
                                <button
                                  key={m._id}
                                  type="button"
                                  className="bill-menu-item"
                                  onClick={() => addMenuItemToBill(m)}
                                  disabled={isLoading}
                                >
                                  <span className="bill-menu-item-name">{m.name}</span>
                                  <span className="bill-menu-item-meta">
                                    ₹{Number(m.price || 0)}{Number(m.gst ?? 0) ? ` • ${Number(m.gst)}% GST` : ''}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="bill-add-actions">
                        <button
                          type="button"
                          className="bill-add-cancel"
                          onClick={() => setIsAddItemOpen(false)}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bill-summary">
                  <div className="bill-summary-row">
                    <span>Subtotal</span>
                    <strong>₹{Number(computedSubtotal || 0).toFixed(2)}</strong>
                  </div>
                  <div className="bill-summary-row">
                    <span>GST</span>
                    <strong>₹{Number(computedGst || 0).toFixed(2)}</strong>
                  </div>
                  <div className="bill-summary-row total">
                    <span>Grand Total</span>
                    <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
                  </div>
                </div>

                <div className="bill-panel-bottom">
                  <button
                    className="bill-panel-btn"
                    onClick={() => {
                      if(isLoading) return;
                      printBillOnly();
                    }}
                    disabled={isLoading || billItems.length === 0}
                  >
                    Generate Bill
                  </button>

                  {paymentMethod ? (
                    <button
                      className="bill-panel-btn primary"
                      onClick={() => setIsPayConfirmOpen(true)}
                      disabled={isLoading || billItems.length === 0}
                    >
                      Confirm Payment
                    </button>
                  ) : (
                    <div className="bill-panel-hint">
                      Select payment method
                    </div>
                  )}
                </div>

                <div className="bill-payment-methods">
                  <h4>Payment Method</h4>
                  <div className="payment-options-inline">
                    {paymentOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`pay-option-inline ${paymentMethod === option.id ? 'active' : ''}`}
                        onClick={() => requestPaymentMethod(option.id)}
                      >
                        <i className={option.icon}></i>
                        <span>{option.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {isPayConfirmOpen && (
                <div
                  className="pay-confirm-overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Confirm Payment"
                  onClick={() => !isLoading && setIsPayConfirmOpen(false)}
                >
                  <div className="pay-confirm-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="pay-confirm-header">
                      <h3>Confirm Payment</h3>
                      <button
                        className="pay-confirm-close"
                        onClick={() => setIsPayConfirmOpen(false)}
                        disabled={isLoading}
                        aria-label="Close"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>

                    <div className="pay-confirm-body">
                      <div className="pay-confirm-card">
                        <div className="pay-confirm-row">
                          <span>Table</span>
                          <strong>{getTableLabel(selectedTable)}</strong>
                        </div>
                        <div className="pay-confirm-row">
                          <span>Method</span>
                          <strong>{paymentOptions.find((p) => p.id === paymentMethod)?.label || paymentMethod}</strong>
                        </div>
                        <div className="pay-confirm-total">
                          <span>Amount</span>
                          <strong>₹{Number(computedTotal || 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="pay-confirm-actions">
                      <button
                        className="pay-confirm-cancel"
                        onClick={() => setIsPayConfirmOpen(false)}
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                      <button
                        className="pay-confirm-ok"
                        onClick={confirmPayment}
                        disabled={isLoading || !paymentMethod}
                      >
                        Payment Complete
                      </button>
                    </div>
                  </div>
                </div>
              )}
                </aside>
              </div>
            </div>
          )}
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
          title="Tables"
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="page-content">
          {content}
        </div>

      </div>

    </div>
  );
};

export default TableView;

