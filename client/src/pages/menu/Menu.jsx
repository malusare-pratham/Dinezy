import React, { useEffect, useMemo, useState } from 'react';
import './Menu.css';
import Sidebar from '../../components/common/Sidebar';
import Header from '../../components/common/Header';

const Menu = () => {
  const [sidebarOpen,setSidebarOpen] =
    useState(false);
  const categories = [
    'All',
    'Starter',
    'Main Course',
    'Breads',
    'Rice & Biryani',
    'Colddrinks',
    'Desserts',
    'Breakfast'
  ];

  const [activeCategory,setActiveCategory] = useState('All');
  const [menus,setMenus] = useState([]);
  const [isLoading,setIsLoading] = useState(false);

  const [isModalOpen,setIsModalOpen] = useState(false);
  const [editingId,setEditingId] = useState(null);
  const [subCategoryInput,setSubCategoryInput] = useState('');

  const [form,setForm] = useState({
    name:'',
    category:'Starter',
    price:'',
    hsn:'21069099',
    gst:5,
    type:'VEG',
    subCategories:[],
    isAvailable:true
  });

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;
  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }

  const API_URL =
    import.meta.env.VITE_API_URL ||
    'http://localhost:5000';

  const token =
    localStorage.getItem('dinezy_token');

  const fetchMenus = async () => {

    setIsLoading(true);

    try{

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
          data?.message || 'Failed To Load Menu'
        );
      }

      setMenus(data.menus || []);

    }
    catch(error){
      alert(error.message);
    }
    finally{
      setIsLoading(false);
    }

  };

  useEffect(() => {
    if(!token) return;
    fetchMenus();
  },[]);

  const filteredMenus = useMemo(() => {

    if(activeCategory === 'All'){
      return menus;
    }

    return menus.filter(
      (m) => m.category === activeCategory
    );

  },[activeCategory,menus]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      name:'',
      category:'Starter',
      price:'',
      hsn:'21069099',
      gst:5,
      type:'VEG',
      subCategories:[],
      isAvailable:true
    });
    setSubCategoryInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (menu) => {
    setEditingId(menu._id);
    const inferredType =
      (menu.type || menu.diet || 'VEG');
    setForm({
      name:menu.name || '',
      category:menu.category || 'Starter',
      price:menu.price ?? '',
      hsn:menu.hsn || '',
      gst:menu.gst ?? 5,
      type:String(inferredType).toUpperCase() === 'JAIN'
        ? 'VEG'
        : inferredType,
      subCategories:Array.isArray(menu.subCategories) ? menu.subCategories : [],
      isAvailable:menu.isAvailable ?? true
    });
    setSubCategoryInput('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSubCategoryInput('');
  };

  const addSubCategory = () => {

    const raw =
      (subCategoryInput || '').trim();

    if(!raw) return;

    const parts = raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if(parts.length === 0) return;

    setForm((prev) => ({
      ...prev,
      subCategories:Array.from(new Set([
        ...(prev.subCategories || []),
        ...parts
      ]))
    }));

    setSubCategoryInput('');
  };

  const removeSubCategory = (value) => {
    setForm((prev) => ({
      ...prev,
      subCategories:(prev.subCategories || [])
        .filter((s) => s !== value)
    }));
  };

  const saveMenu = async () => {

    try{

      if(!form.name?.trim()){
        throw new Error('Item Name Required');
      }

      const price = Number(form.price);
      if(Number.isNaN(price) || price <= 0){
        throw new Error('Valid Price Required');
      }

      const gst = Number(form.gst);
      if(Number.isNaN(gst) || gst < 0){
        throw new Error('Valid GST Required');
      }

      const payload = {
        name:form.name.trim(),
        category:form.category,
        price,
        hsn:form.hsn?.trim() || '',
        gst,
        type:form.type,
        subCategories:Array.from(new Set([
          ...(form.subCategories || []),
          ...((subCategoryInput || '').trim()
            ? (subCategoryInput || '')
              .split(',')
              .map((p) => p.trim())
              .filter(Boolean)
            : [])
        ])),
        isAvailable:!!form.isAvailable
      };

      const isEdit = !!editingId;

      const res = await fetch(
        isEdit
          ? `${API_URL}/api/menu/update/${editingId}`
          : `${API_URL}/api/menu/create`,
        {
          method:isEdit ? 'PUT' : 'POST',
          headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${token}`
          },
          body:JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(
          data?.message || 'Save Failed'
        );
      }

      closeModal();
      fetchMenus();

    }
    catch(error){
      alert(error.message);
    }

  };

  const deleteMenu = async (id) => {

    const ok = window.confirm(
      'Delete This Item?'
    );

    if(!ok) return;

    try{

      const res = await fetch(
        `${API_URL}/api/menu/delete/${id}`,
        {
          method:'DELETE',
          headers:{
            Authorization:`Bearer ${token}`
          }
        }
      );

      const data = await res.json();

      if(!res.ok || !data?.success){
        throw new Error(
          data?.message || 'Delete Failed'
        );
      }

      fetchMenus();

    }
    catch(error){
      alert(error.message);
    }

  };

  return (
    <div className="dashboard-layout">

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-content">

        <Header
          title="Menu"
          user={user}
          onMenuClick={() => setSidebarOpen((v) => !v)}
        />

        <div className="page-content">

          <div className="menu-page">
          <div className="menu-container">
      {/* Header Section */}
      <header className="menu-header">
        <div className="menu-header-left">
          <p className="catalog-text">CATALOG</p>
          <h1><i className="fa-solid fa-layer-group"></i> Menu Items</h1>
        </div>
        <button className="add-item-btn" onClick={openCreateModal}>
          <i className="fa-solid fa-plus"></i> Add Item
        </button>
      </header>

      {/* Categories Section */}
      <div className="categories-list">
        {categories.map((cat) => (
          <button 
            key={cat} 
            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table Section */}
      <div className="table-wrapper">
        <table className="menu-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Price</th>
              <th>HSN</th>
              <th>GST</th>
              <th>Type</th>
              <th>Subcategory</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="8">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredMenus.map((m) => (
                <tr key={m._id}>
                  <td className="item-name" data-label="Item">{m.name}</td>
                  <td data-label="Category">{m.category}</td>
                   <td className="price-text" data-label="Price">₹{Number(m.price || 0).toFixed(2)}</td>
                  <td data-label="HSN">{m.hsn || '-'}</td>
                  <td data-label="GST">{(m.gst ?? 0)}%</td>
                  <td data-label="Type">
                    <span className="type-badge">
                      {String(m.type || m.diet || 'VEG').toUpperCase() === 'JAIN'
                        ? 'VEG'
                        : String(m.type || m.diet || 'VEG').toUpperCase()}
                    </span>
                  </td>
                  <td className="subcat-cell" data-label="Subcategory">
                    {(Array.isArray(m.subCategories) && m.subCategories.length > 0)
                      ? m.subCategories.join(', ')
                      : '-'}
                  </td>
                  <td className="action-icons" data-label="Actions">
                    <i className="fa-regular fa-pen-to-square edit-icon" onClick={() => openEditModal(m)}></i>
                    <i className="fa-regular fa-trash-can delete-icon" onClick={() => deleteMenu(m._id)}></i>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="menu-modal-backdrop">
          <div className="menu-modal">

            <div className="menu-modal-header">
              <h3>
                {editingId ? 'Edit Item' : 'Add Item'}
              </h3>
              <button
                className="menu-modal-close"
                onClick={closeModal}
                type="button"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="menu-modal-body">

              <div className="menu-form-row">
                <label>Item</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({
                    ...form,
                    name:e.target.value
                  })}
                  placeholder="Item Name"
                />
              </div>

              <div className="menu-form-row">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({
                    ...form,
                    category:e.target.value
                  })}
                >
                  {categories.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="menu-form-row">
                <label>Type</label>
                <div className="menu-type-toggle" role="radiogroup" aria-label="Type">
                  <label className={`type-pill ${form.type === 'VEG' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="menu_type"
                      value="VEG"
                      checked={form.type === 'VEG'}
                      onChange={() => setForm({
                        ...form,
                        type:'VEG'
                      })}
                    />
                    Veg
                  </label>
                  <label className={`type-pill ${form.type === 'NON-VEG' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="menu_type"
                      value="NON-VEG"
                      checked={form.type === 'NON-VEG'}
                      onChange={() => setForm({
                        ...form,
                        type:'NON-VEG'
                      })}
                    />
                    Non-Veg
                  </label>
                </div>
              </div>

              <div className="menu-form-grid">
                <div className="menu-form-row">
                  <label>Price</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({
                      ...form,
                      price:e.target.value
                    })}
                    placeholder="280"
                  />
                </div>

                <div className="menu-form-row">
                  <label>HSN</label>
                  <input
                    value={form.hsn}
                    onChange={(e) => setForm({
                      ...form,
                      hsn:e.target.value
                    })}
                    placeholder="21069099"
                  />
                </div>

                <div className="menu-form-row">
                  <label>GST %</label>
                  <input
                    type="number"
                    value={form.gst}
                    onChange={(e) => setForm({
                      ...form,
                      gst:e.target.value
                    })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="menu-form-row">
                <label>Subcategory (Optional)</label>
                <div className="subcat-add-row">
                  <input
                    value={subCategoryInput}
                    onChange={(e) => setSubCategoryInput(e.target.value)}
                    placeholder="e.g. Chocolate, Mango"
                    onKeyDown={(e) => {
                      if(e.key === 'Enter'){
                        e.preventDefault();
                        addSubCategory();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="subcat-add-btn"
                    onClick={addSubCategory}
                  >
                    Add
                  </button>
                </div>

                {(form.subCategories || []).length > 0 && (
                  <div className="subcat-list">
                    {(form.subCategories || []).map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="subcat-chip"
                        onClick={() => removeSubCategory(s)}
                        title="Remove"
                      >
                        {s} <span className="subcat-remove">×</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="menu-modal-actions">
              <button
                className="menu-cancel-btn"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="menu-save-btn"
                onClick={saveMenu}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;



