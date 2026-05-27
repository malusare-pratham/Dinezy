import './OrderSection.css';
import { useEffect, useMemo, useState } from 'react';
import { getSocket } from '../../socket/socket';

const CATEGORIES = [
  'All',
  'Starter',
  'Main Course',
  'Breads',
  'Rice & Biryani',
  'Colddrinks',
  'Desserts',
  'Breakfast'
];

const normalizeDiet = (value) => {
  const v = String(value || '').trim().toUpperCase();
  if (v === 'JAIN') return 'VEG';
  return v;
};

const OrderSection = ({
  table,
  onBack,
  onOpenBilling,
}) => {

  const token = localStorage.getItem('dinezy_token');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const apiBase = useMemo(() => {
    const raw = String(API_URL || '').replace(/\/+$/, '');
    if (raw.toLowerCase().endsWith('/api')) {
      return raw.slice(0, -4);
    }
    return raw;
  }, [API_URL]);

  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dietFilter, setDietFilter] = useState('VEG');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Starter');
  const [variantByMenuId, setVariantByMenuId] = useState({});

  const [cart, setCart] = useState([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [existingKots, setExistingKots] = useState([]);

  useEffect(() => {
    setActiveCategory('Starter');
  }, [table?._id, table?.tableNumber]);

  const fetchMenus = async () => {
    const res = await fetch(
      `${apiBase}/api/menu/all`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok || !data?.success) {
      throw new Error(
        data?.message || 'Failed to load menu'
      );
    }

    setMenus(data.menus || []);
  };

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setIsLoading(true);
      try {
        await fetchMenus();
      }
      catch (error) {
        alert(error.message);
      }
      finally {
        setIsLoading(false);
      }
    };

    load();
  }, [token]);

  const fetchExistingKots = async () => {
    if(!token) return;
    if(!table?._id && !table?.tableNumber) return;

    const tableId =
      table?._id ? String(table._id) : '';

    const tableNumber =
      table?.tableNumber != null ? Number(table.tableNumber) : null;

    const primaryUrl =
      tableId
        ? `${apiBase}/api/kot/by-table?tableId=${encodeURIComponent(tableId)}&unbilled=true`
        : `${apiBase}/api/kot/by-table?tableNumber=${encodeURIComponent(String(tableNumber))}&unbilled=true`;

    let res = await fetch(
      primaryUrl,
      {
        headers:{
          Authorization:`Bearer ${token}`
        }
      }
    );

    if(res.status === 404 && tableNumber != null){
      // Backward compatibility: older server may not have /by-table yet.
      const fallbackUrl =
        `${apiBase}/api/kot/all?tableNumber=${encodeURIComponent(String(tableNumber))}`;

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
      throw new Error(data?.message || 'Failed to load previous orders');
    }

    const list =
      Array.isArray(data.kots) ? data.kots : [];

    setExistingKots(list.filter((k) => k?.isBilled === false));
  };

  useEffect(() => {
    if(!token) return;
    if(!table?._id && !table?.tableNumber) return;

    fetchExistingKots().catch(() => {});

    const id = setInterval(() => {
      fetchExistingKots().catch(() => {});
    },6000);

    return () => clearInterval(id);
  },[apiBase, token, table?._id, table?.tableNumber]);

  const existingItems = useMemo(() => {
    // Merge by name + price + gst
    const merged = new Map();

    for(const kot of (existingKots || [])){
      const status = String(kot?.status || '').toUpperCase();
      // Show in "Previous Items" only after Kitchen marks READY.
      if(status !== 'READY') continue;
      for(const it of (kot?.items || [])){
        const name = String(it?.name || '').trim();
        const price = Number(it?.price || 0);
        const gst = Number(it?.gst ?? 0);
        const qty = Number(it?.quantity || 0);
        if(!name || qty <= 0) continue;

        const key = `${name}@@${price}@@${gst}`;
        const prev = merged.get(key);
        merged.set(
          key,
          {
            name,
            price,
            gst,
            qty: (prev?.qty || 0) + qty
          }
        );
      }
    }

    return Array.from(merged.values())
      .sort((a,b) => String(a.name).localeCompare(String(b.name)));
  },[existingKots]);

  const existingTotals = useMemo(() => {
    let subtotal = 0;
    let gstAmount = 0;

    for(const it of (existingItems || [])){
      const qty = Number(it?.qty || 0);
      const price = Number(it?.price || 0);
      const gst = Number(it?.gst ?? 0);
      if(qty <= 0) continue;

      const line = price * qty;
      subtotal += line;
      gstAmount += (line * gst / 100);
    }

    return {
      subtotal,
      gstAmount,
      total: subtotal + gstAmount
    };
  },[existingItems]);

  const latestKOT = useMemo(() => {
    const list = Array.isArray(existingKots) ? existingKots : [];
    const sorted = list
      .filter((k) => k && k?._id)
      .filter((k) => {
        const status = String(k?.status || '').toUpperCase();
        return status === 'RECEIVED' || status === 'PREPARING';
      })
      .slice()
      .sort((a,b) => (
        new Date(b?.createdAt || 0).getTime() -
        new Date(a?.createdAt || 0).getTime()
      ));
    return sorted[0] || null;
  },[existingKots]);

  useEffect(() => {
    if(!table?._id && !table?.tableNumber) return;

    const socket = getSocket();

    const matchesTable = (kot) => {
      if(!kot) return false;
      if(table?._id && String(kot?.table || '') === String(table._id)) return true;
      if(table?.tableNumber != null && Number(kot?.tableNumber) === Number(table.tableNumber)) return true;
      return false;
    };

    const onStatus = (kot) => {
      if(!kot?._id) return;
      if(!matchesTable(kot)) return;
      if(kot?.isBilled === true) return;

      setExistingKots((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        const idx = list.findIndex((k) => String(k?._id || '') === String(kot._id));
        if(idx === -1) return [kot, ...list];
        const next = list.slice();
        next[idx] = { ...next[idx], ...kot };
        return next;
      });
    };

    socket.on('kot-status-updated', onStatus);
    return () => {
      socket.off('kot-status-updated', onStatus);
    };
  },[table?._id, table?.tableNumber]);

  const latestKOTItems = useMemo(() => {
    const items = Array.isArray(latestKOT?.items) ? latestKOT.items : [];
    return items
      .map((it) => ({
        name:String(it?.name || '').trim(),
        qty:Number(it?.quantity || 0),
        price:Number(it?.price || 0)
      }))
      .filter((it) => it.name && it.qty > 0);
  },[latestKOT]);

  const upsertCustomer = async (name, phone) => {
    const normalizedPhone = String(phone || '').replace(/\D/g, '').trim();

    if (!normalizedPhone) {
      throw new Error('Mobile number is required');
    }

    const res = await fetch(
      `${apiBase}/api/customer/upsert`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: String(name || '').trim(),
          phone: normalizedPhone
        })
      }
    );

    const data = await res.json();

    if (!res.ok || !data?.success) {
      throw new Error(
        data?.message || 'Failed to save customer'
      );
    }

    return data.customer;
  };

  const filteredMenu = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();

    return (menus || [])
      .filter((m) => !!m && !!m._id)
      .filter((m) => {
        if (dietFilter === 'ALL') return true;
        return normalizeDiet(m.type || m.diet) === dietFilter;
      })
      .filter((m) => {
        if (activeCategory === 'All') return true;
        return (
          String(m.category || '').trim().toLowerCase() ===
          String(activeCategory).trim().toLowerCase()
        );
      })
      .filter((m) => {
        if (!q) return true;
        const name = String(m.name || '').toLowerCase();
        const cat = String(m.category || '').toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name)));

  }, [menus, dietFilter, activeCategory, search]);

  const addToCart = (menu) => {
    const menuId = menu?._id;
    if (!menuId) return;

    const variant = (variantByMenuId[menuId] || '').trim();
    const name = variant ? `${menu.name} - ${variant}` : menu.name;

    setCart((prev) => {
      const existing = prev.find((i) => i.menuId === menuId && (i.variant || '') === variant);

      if (existing) {
        return prev.map((i) => (
          i.menuId === menuId && (i.variant || '') === variant
            ? { ...i, qty: i.qty + 1 }
            : i
        ));
      }

      return [
        ...prev,
        {
          menuId,
          name,
          variant,
          price: Number(menu.price || 0),
          gst: Number(menu.gst ?? 0),
          qty: 1
        }
      ];
    });
  };

  const removeFromCart = (menuId, variant) => {
    setCart((prev) => prev.filter((i) => !(i.menuId === menuId && (i.variant || '') === (variant || ''))));
  };

  const changeQty = (menuId, variant, delta) => {
    setCart((prev) => prev.map((i) => {
      if (i.menuId !== menuId) return i;
      if ((i.variant || '') !== (variant || '')) return i;
      return { ...i, qty: Math.max(1, (i.qty || 1) + delta) };
    }));
  };

  const decrementOrRemove = (menuId, variant) => {
    setCart((prev) => {
      const next = [];
      for (const i of prev) {
        if (i.menuId !== menuId || (i.variant || '') !== (variant || '')) {
          next.push(i);
          continue;
        }

        const currentQty = Number(i.qty || 1);
        const newQty = currentQty - 1;
        if (newQty > 0) {
          next.push({ ...i, qty: newQty });
        }
      }
      return next;
    });
  };

  const subtotal = useMemo(() => (
    (cart || []).reduce((acc, i) => acc + (Number(i.price || 0) * Number(i.qty || 0)), 0)
  ), [cart]);

  const gstAmount = useMemo(() => (
    (cart || []).reduce((acc, i) => {
      const price = Number(i.price || 0) * Number(i.qty || 0);
      const gst = Number(i.gst ?? 0);
      return acc + (price * gst / 100);
    }, 0)
  ), [cart]);

  const total = useMemo(() => subtotal + gstAmount, [subtotal, gstAmount]);

  const submitKOT = async () => {
    if (!table?._id) {
      alert('Select a table');
      return;
    }
    if (cart.length === 0) {
      alert('Add items first');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        tableId: table._id,
        tableNumber: table.tableNumber,
        customerName: customerName.trim(),
        items: cart.map((i) => ({
          menuItem: i.menuId,
          quantity: i.qty,
          variant: i.variant || ''
        }))
      };

      const res = await fetch(
        `${apiBase}/api/kot/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!res.ok || !data?.success) {
        throw new Error(
          data?.message || 'Failed to generate KOT'
        );
      }

      setCart([]);
      setCustomerName('');
      setVariantByMenuId({});
      setIsConfirmOpen(false);

      fetchExistingKots().catch(() => {});
      alert('KOT generated');
    }
    catch (error) {
      alert(error.message);
    }
    finally {
      setIsLoading(false);
    }
  };

  const openConfirm = () => {
    if (cart.length === 0) {
      alert('Add items first');
      return;
    }
    setIsConfirmOpen(true);
  };

  useEffect(() => {
    if (!isConfirmOpen) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsConfirmOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isConfirmOpen]);

  const openBilling = () => {
    if (typeof onOpenBilling !== 'function') return;
    if (!table?._id) {
      alert('Select a table');
      return;
    }
    const name = customerName.trim();
    const phone = String(customerPhone || '').replace(/\D/g, '').trim();

    const open = async () => {
      setIsLoading(true);
      try {
        if (phone) {
          await upsertCustomer(name, phone);
        }
        onOpenBilling({
          table,
          customerName: name || '',
          customerPhone: phone || ''
        });
      }
      catch (error) {
        alert(error.message);
      }
      finally {
        setIsLoading(false);
      }
    };

    open();
  };

  return (
    <div className="order-container">
      <div className="order-topbar">
        <button className="back-tables-btn" onClick={onBack} disabled={isLoading}>
          <i className="fa-solid fa-chevron-left"></i> Back
        </button>
      </div>

      {/* Left Section: Menu Selection */}
      <div className="menu-selection">
        <header className="menu-header">
          <div className="table-info">
            <h1>{table?.code || `Table ${table?.tableNumber ?? ''}`}</h1>
            <p>Take order and manage KOT</p>
          </div>
        </header>

        <div className="search-filter-bar">
          <div className="input-group">
            <i className="fa-regular fa-user"></i>
            <input
              type="text"
              aria-label="Customer Name"
              placeholder="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <i className="fa-solid fa-phone"></i>
            <input
              type="text"
              aria-label="Mobile Number"
              placeholder="Mobile Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              inputMode="numeric"
            />
          </div>
        </div>

        <div className="diet-toggle">
          <button
            type="button"
            className={dietFilter === 'VEG' ? 'diet-box active' : 'diet-box'}
            onClick={() => setDietFilter('VEG')}
            disabled={isLoading}
          >
            <span className="diet-dot veg"></span>
            Veg
          </button>
          <button
            type="button"
            className={dietFilter === 'NON-VEG' ? 'diet-box active' : 'diet-box'}
            onClick={() => setDietFilter('NON-VEG')}
            disabled={isLoading}
          >
            <span className="diet-dot non-veg"></span>
            Non-Veg
          </button>
        </div>

        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search menu items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="category-tabs">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={activeCategory === c ? 'tab active' : 'tab'}
              onClick={() => setActiveCategory(c)}
              disabled={isLoading}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="menu-grid">
          {filteredMenu.map((item) => (
            <div key={item._id} className="menu-card">
              <div className="item-type">
                <span className={`dot ${normalizeDiet(item.type || item.diet) === 'NON-VEG' ? 'non-veg' : 'veg'}`}></span>
                <span className="cat-name">{item.category}</span>
              </div>
              <h3>{item.name}</h3>
              <p className="item-price">₹{item.price}</p>

              {Array.isArray(item.subCategories) && item.subCategories.length > 0 && (
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <i className="fa-solid fa-list"></i>
                  <select
                    value={variantByMenuId[item._id] || ''}
                    onChange={(e) => setVariantByMenuId((prev) => ({
                      ...prev,
                      [item._id]: e.target.value
                    }))}
                    style={{
                      border: 'none',
                      outline: 'none',
                      width: '100%',
                      background: 'transparent',
                      color: '#f8fafc',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="" style={{ background: '#22222a' }}>Default</option>
                    {item.subCategories.map((s) => (
                      <option key={s} value={s} style={{ background: '#22222a' }}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {(() => {
                const menuId = item?._id;
                const variant = (variantByMenuId[menuId] || '').trim();
                const inCart = cart.find((i) => i.menuId === menuId && (i.variant || '') === variant);
                const qty = Number(inCart?.qty || 0);

                if (qty > 0) {
                  return (
                    <div className="qty-stepper menu-qty-stepper" aria-label="Quantity">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        onClick={() => decrementOrRemove(menuId, variant)}
                        disabled={isLoading}
                      >
                        -
                      </button>
                      <span aria-label="Quantity value">{qty}</span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        onClick={() => addToCart(item)}
                        disabled={isLoading}
                      >
                        +
                      </button>
                    </div>
                  );
                }

                return (
                  <button className="add-to-cart-btn" onClick={() => addToCart(item)} disabled={isLoading}>
                    <i className="fa-solid fa-plus"></i> Add
                  </button>
                );
              })()}
            </div>
          ))}

          {!isLoading && filteredMenu.length === 0 && (
            <div style={{ color: '#64748b', fontWeight: 600 }}>
              No items found
            </div>
          )}
        </div>
      </div>

      {/* Right Section: Order Summary */}
      <aside className="order-summary-panel">
        <div className="summary-header">
          <h2><i className="fa-solid fa-cart-shopping"></i> Order Summary</h2>
        </div>

        <div className="existing-orders-panel">
          <div className="existing-orders-header">
            <h2>
              <i className="fa-solid fa-receipt"></i> Previous Items
            </h2>
            <span className="existing-orders-count">
              {existingItems.length}
            </span>
          </div>

          <div className="existing-orders-body">
            {existingItems.length === 0 ? (
              <div className="existing-orders-empty">
                No previous items
              </div>
            ) : (
              <div className="existing-orders-list">
                {existingItems.map((it) => (
                  <div
                    key={`${it.name}@@${it.price}@@${it.gst}`}
                    className="existing-item-row"
                  >
                    <div className="existing-item-left">
                      <div className="existing-item-name">{it.name}</div>
                      <div className="existing-item-meta">
                        <span className="existing-meta-price">
                          {`\u20B9${Number(it.price || 0).toFixed(2)}`}
                        </span>
                        <span className="existing-meta-dot">•</span>
                        <span className="existing-meta-gst">
                          GST {Number(it.gst ?? 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="existing-item-right">
                      <span className="existing-item-qty">
                        {`\u00D7${Number(it.qty || 0)}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="existing-orders-summary">
            <div className="existing-sum-row">
              <span>Subtotal</span>
              <span>{`\u20B9${Number(existingTotals.subtotal || 0).toFixed(2)}`}</span>
            </div>
            <div className="existing-sum-row">
              <span>GST</span>
              <span>{`\u20B9${Number(existingTotals.gstAmount || 0).toFixed(2)}`}</span>
            </div>
            <div className="existing-sum-row total">
              <span>Total</span>
              <span>{`\u20B9${Number(existingTotals.total || 0).toFixed(2)}`}</span>
            </div>
          </div>
        </div>

        <div className="cart-items-list">
          {cart.length === 0 ? (
            latestKOTItems.length > 0 ? (
              <div className="latest-kot-box">
                <div className="latest-kot-title">
                  Latest KOT: {latestKOT?.tokenNumber || '#'}
                </div>
                {latestKOTItems.map((it, idx) => (
                  <div key={`${it.name}:${it.price}:${idx}`} className="latest-kot-row">
                    <div className="latest-kot-left">
                      <div className="latest-kot-name">{it.name}</div>
                      <div className="latest-kot-meta">{`\u20B9${Number(it.price || 0).toFixed(2)}`}</div>
                    </div>
                    <div className="latest-kot-right">{`\u00D7${Number(it.qty || 0)}`}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#94a3b8', fontWeight: 700, padding: '12px 0' }}>
                No items added
              </div>
            )
          ) : cart.map((item) => (
            <div key={`${item.menuId}:${item.variant || ''}`} className="cart-item">
              <div className="cart-item-top">
                <div className="cart-item-info">
                  <div className="name-row">
                    <h4>{item.name}</h4>
                    <button className="remove-link" onClick={() => removeFromCart(item.menuId, item.variant)}>Remove</button>
                  </div>
                  <p className="unit-price">₹{item.price}</p>
                </div>
              </div>
              <div className="cart-item-actions">
                <div className="qty-stepper">
                  <button onClick={() => changeQty(item.menuId, item.variant, -1)}>-</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.menuId, item.variant, 1)}>+</button>
                </div>
                <p className="total-item-price">₹{Number(item.price || 0) * Number(item.qty || 0)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bill-calculations">
          <div className="calc-row">
            <span>Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="calc-row">
            <span>GST</span>
            <span>₹{gstAmount.toFixed(2)}</span>
          </div>
          <div className="calc-row total-row">
            <span>Total</span>
            <span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="action-buttons">
          <button className="generate-kot-btn" onClick={openConfirm} disabled={isLoading || cart.length === 0}>
            <i className="fa-solid fa-utensils"></i> Generate KOT
          </button>
          <button className="open-billing-btn" onClick={openBilling} disabled={isLoading}>
            <i className="fa-solid fa-receipt"></i> Billing
          </button>
          {cart.length === 0 && (
            <p className="error-hint">Add items first</p>
          )}
        </div>
      </aside>

      {isConfirmOpen && (
        <div
          className="kot-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm KOT"
          onClick={() => !isLoading && setIsConfirmOpen(false)}
        >
          <div className="kot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kot-modal-header">
              <h3>Confirm KOT</h3>
              <button className="kot-modal-close" onClick={() => setIsConfirmOpen(false)} disabled={isLoading} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="kot-modal-body">
              <div className="kot-modal-card">
                <div className="kot-meta">
                  <div className="kot-table">{table?.code || `Table ${table?.tableNumber ?? ''}`}</div>
                  {customerName.trim() && (
                    <div className="kot-customer">{customerName.trim()}</div>
                  )}
                </div>

                <div className="kot-items">
                  {cart.map((item) => (
                    <div key={`kot:${item.menuId}:${item.variant || ''}`} className="kot-item-row">
                      <div className="kot-item-left">
                        <div className="kot-item-name">{item.name} <span className="kot-item-qty">x {item.qty}</span></div>
                      </div>
                      <div className="kot-item-right">₹{(Number(item.price || 0) * Number(item.qty || 0)).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="kot-total-row">
                  <div className="kot-total-label">Total</div>
                  <div className="kot-total-amount">₹{total.toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="kot-modal-actions">
              <button className="kot-cancel-btn" onClick={() => setIsConfirmOpen(false)} disabled={isLoading}>
                Cancel
              </button>
              <button className="kot-confirm-btn" onClick={submitKOT} disabled={isLoading}>
                Confirm &amp; Send to Kitchen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSection;
