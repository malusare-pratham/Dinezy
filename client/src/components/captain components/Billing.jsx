import { useEffect, useMemo, useState } from 'react';
import './Billing.css';

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

const Billing = ({
  table,
  customerName = '',
  onBack,
  onComplete
}) => {
  const [kots, setKots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('dinezy_token');

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  const [captainName] = useState(() => {
    try{
      const raw =
        localStorage.getItem('dinezy_user');
      const user =
        raw ? JSON.parse(raw) : null;
      return (
        user?.name ||
        user?.fullName ||
        user?.username ||
        ''
      );
    }
    catch{
      return '';
    }
  });

  const apiBase = useMemo(() => {
    const raw = String(API_URL || '').replace(/\/+$/,'');
    if(raw.toLowerCase().endsWith('/api')){
      return raw.slice(0,-4);
    }
    return raw;
  },[API_URL]);

  const tableNumber =
    table?.tableNumber ?? null;

  const tableId =
    table?._id ? String(table._id) : '';

  const [draftItems,setDraftItems] = useState([]);

  const fetchBillDraft = async () => {
    if(!token) return;
    if(!tableId) return;

    const res = await fetch(
      `${apiBase}/api/table/bill-draft/${encodeURIComponent(tableId)}`,
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

    setDraftItems(Array.isArray(data.billDraftItems) ? data.billDraftItems : []);
  };

  useEffect(() => {
    if(!token) return;
    if(!tableId && !tableNumber) return;

    const load = async () => {
      setIsLoading(true);
      try{
        const primaryUrl =
          tableId
            ? `${apiBase}/api/kot/by-table?tableId=${encodeURIComponent(tableId)}&unbilled=true`
            : `${apiBase}/api/kot/by-table?tableNumber=${encodeURIComponent(tableNumber)}&unbilled=true`;

        let res = await fetch(
          primaryUrl,
          {
            headers:{
              Authorization:`Bearer ${token}`
            }
          }
        );

        if(res.status === 404 && tableNumber){
          // Backward compatibility: older server may not have /by-table yet.
          const fallbackUrl =
            `${apiBase}/api/kot/all?tableNumber=${encodeURIComponent(tableNumber)}`;

          res = await fetch(
            fallbackUrl,
            {
              headers:{
                Authorization:`Bearer ${token}`
              }
            }
          );
        }

        const data = await res.json();

        if(!res.ok || !data?.success){
          throw new Error(data?.message || 'Failed to load KOTs');
        }

        const list = Array.isArray(data.kots) ? data.kots : [];
        setKots(list.filter((k) => !k?.isBilled));
      }
      catch(error){
        alert(error.message);
        setKots([]);
      }
      finally{
        setIsLoading(false);
      }
    };

    load();
  },[apiBase, tableId, tableNumber, token]);

  useEffect(() => {
    if(!token) return;
    if(!tableId) return;

    fetchBillDraft().catch(() => {});

    const id = setInterval(() => {
      fetchBillDraft().catch(() => {});
    },6000);

    return () => clearInterval(id);
  },[apiBase, tableId, token]);

  const [billNo] = useState(() => (
    `BILL-${Date.now().toString(36).toUpperCase()}`
  ));

  const mergedItems = useMemo(() => {
    const map = new Map();

    for(const kot of (kots || [])){
      for(const it of (kot?.items || [])){
        const name = String(it?.name || '').trim();
        const price = Number(it?.price || 0);
        const gst = Number(it?.gst ?? 0);
        const qty = Number(it?.quantity || 0);
        if(!name || qty <= 0) continue;

        const key = `${name}@@${price}@@${gst}`;

        const prev = map.get(key);
        if(prev){
          map.set(key, {
            ...prev,
            qty: prev.qty + qty,
            total: (prev.qty + qty) * price
          });
        }
        else{
          map.set(key, {
            name,
            price,
            gst,
            qty,
            total: qty * price
          });
        }
      }
    }

    // Merge manager-added bill draft items (name + price + gst)
    for(const it of (draftItems || [])){
      const name = String(it?.name || '').trim();
      const price = Number(it?.price || 0);
      const gst = Number(it?.gst ?? 0);
      const qty = Number(it?.quantity || 0);
      if(!name || qty <= 0) continue;

      const key = `${name}@@${price}@@${gst}`;
      const prev = map.get(key);
      if(prev){
        map.set(key, {
          ...prev,
          qty: prev.qty + qty,
          total: (prev.qty + qty) * price
        });
      }
      else{
        map.set(key, {
          name,
          price,
          gst,
          qty,
          total: qty * price
        });
      }
    }

    return Array.from(map.values()).sort((a,b) => a.name.localeCompare(b.name));
  },[kots,draftItems]);

  const computedSubtotal = useMemo(() => (
    (mergedItems || []).reduce((acc, i) => acc + Number(i?.total || 0), 0)
  ),[mergedItems]);

  const computedGst = useMemo(() => (
    (mergedItems || []).reduce((acc, i) => {
      const line = Number(i?.total || 0);
      const gst = Number(i?.gst ?? 0);
      return acc + (line * gst / 100);
    }, 0)
  ),[mergedItems]);

  const computedCgst = useMemo(() => (
    Number(computedGst || 0) / 2
  ),[computedGst]);

  const computedSgst = useMemo(() => (
    Number(computedGst || 0) / 2
  ),[computedGst]);

  const computedTotal = useMemo(() => (
    computedSubtotal + computedCgst + computedSgst
  ),[computedSubtotal,computedCgst,computedSgst]);

  const completeOrder = async () => {
    if(!token) return;
    if(!tableId && !tableNumber){
      alert('Table not found');
      return;
    }

    if(mergedItems.length === 0){
      alert('No items to bill');
      return;
    }

    setIsLoading(true);
    try{
      const res = await fetch(
        `${apiBase}/api/kot/complete-order`,
        {
          method:'POST',
          headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${token}`
          },
          body: JSON.stringify({
            tableId: tableId || undefined,
            tableNumber: tableNumber || undefined
          })
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(data?.message || 'Failed to complete order');
      }

      alert('Order completed');
      if(typeof onComplete === 'function') onComplete();
      else if(typeof onBack === 'function') onBack();
    }
    catch(error){
      alert(error.message);
    }
    finally{
      setIsLoading(false);
    }
  };

  return (
    <div className="billing-container">
      <header className="billing-header">
        <div className="header-titles">
          <h1>Generate Bill</h1>
          <p>Complete order (payment later)</p>
        </div>
        <div style={{ display:'flex', gap: 12 }}>
          {typeof onBack === 'function' && (
            <button className="print-top-btn" onClick={onBack} disabled={isLoading}>
              <i className="fa-solid fa-arrow-left"></i> Back
            </button>
          )}
        </div>
      </header>

      <div className="billing-grid">
        <div className="invoice-preview-card">
          <div className="restaurant-info">
            <h2>DINEZY RESTAURANT</h2>
            <p>123 Main Street, City - 400001</p>
            <p>Phone: +91 98765 43210</p>
            <p>GSTIN: 27XXXXX1234X1ZX</p>
          </div>

          <div className="bill-meta-info">
            <div className="meta-row">
              <div className="meta-item">
                <label>Bill No:</label>
                <span>{billNo}</span>
              </div>
              <div className="meta-item">
                <label>Date & Time:</label>
                <span>{formatDateTime(new Date())}</span>
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-item">
                <label>Table:</label>
                <span>{table?.code || (tableNumber ? `T-${tableNumber}` : '-')}</span>
              </div>
              <div className="meta-item">
                <label>Customer:</label>
                <span>{customerName || '-'}</span>
              </div>
            </div>
            <div className="meta-row">
              <div className="meta-item">
                <label>Captain:</label>
                <span>{captainName || '-'}</span>
              </div>
            </div>
          </div>

          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {mergedItems.map((item, index) => (
                <tr key={`${item.name}:${item.price}:${index}`}>
                  <td>{item.name}</td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-right">₹{Number(item.price || 0)}</td>
                  <td className="text-right">₹{Number(item.total || 0)}</td>
                </tr>
              ))}
              {mergedItems.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign:'center', color:'#94a3b8', fontWeight: 700, padding: '22px 0' }}>
                    {isLoading ? 'Loading...' : 'No items'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="invoice-footer-summary">
            <div className="footer-row">
              <span>Subtotal</span>
              <span>₹{Number(computedSubtotal || 0).toFixed(2)}</span>
            </div>
            <div className="footer-row">
              <span>CGST</span>
              <span>₹{Number(computedCgst || 0).toFixed(2)}</span>
            </div>
            <div className="footer-row">
              <span>SGST</span>
              <span>₹{Number(computedSgst || 0).toFixed(2)}</span>
            </div>
            <div className="footer-row grand-total-row">
              <span>Grand Total</span>
              <span className="blue-total">₹{Number(computedTotal || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="invoice-complete-action">
            <button className="complete-payment-btn" onClick={completeOrder} disabled={isLoading || mergedItems.length === 0}>
              Complete Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Billing;

