import './SelectSection.css';

import { useEffect, useMemo, useState } from 'react';

const SECTION_META = [
  { key:'HALL', name:'Hall Section', icon:'fa-solid fa-couch', color:'#ff6b00' }, // Orange accent
  { key:'AC', name:'AC Hall', icon:'fa-solid fa-snowflake', color:'#ff8533' },
  { key:'FAMILY', name:'Family Section', icon:'fa-solid fa-users', color:'#e67e22' },
  { key:'BAR', name:'Bar Section', icon:'fa-solid fa-martini-glass', color:'#ff944d' }
];

const SelectSection = ({
  onSelectSection
}) => {

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
  const [isLoading,setIsLoading] = useState(false);

  const fetchTables = async () => {

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
      throw new Error(
        data?.message || 'Failed to load tables'
      );
    }

    setTables(data.tables || []);

  };

  const handleSelectSection = async (key) => {
    if(!token) return;

    try{
      onSelectSection?.(key);
    }
    catch(error){
      alert(error.message);
    }
  };

  useEffect(() => {
    if(!token) return;

    const load = async () => {
      setIsLoading(true);
      try{
        await fetchTables();
      }
      catch(error){
        alert(error.message);
      }
      finally{
        setIsLoading(false);
      }
    };

    load();
  },[token]);

  const counts = useMemo(() => {
    const map = new Map();
    for(const s of SECTION_META){
      map.set(s.key,0);
    }
    for(const t of (tables || [])){
      map.set(String(t.section || '').toUpperCase(), (map.get(String(t.section || '').toUpperCase()) || 0) + 1);
    }
    return map;
  },[tables]);

  const sections = SECTION_META.map((s,idx) => ({
    id:idx + 1,
    ...s,
    tables:counts.get(s.key) || 0
  }));

  return (
    <div className="section-container">
      <div className="section-header">
        <h1 className="main-title">Select Section</h1>
        <p className="sub-title">Choose a section to view tables and manage orders</p>
      </div>

      <div className="sections-grid">
        {sections.map((item) => (
          <div
            key={item.id}
            className="section-card-premium"
            role="button"
            tabIndex={0}
            onClick={() => handleSelectSection(item.key)}
            onKeyDown={(e) => {
              if(e.key === 'Enter' || e.key === ' '){
                e.preventDefault();
                handleSelectSection(item.key);
              }
            }}
            aria-disabled={isLoading}
          >
            <div className="card-top-glow" style={{ backgroundColor: item.color }}></div>
            <div className="icon-wrapper" style={{ color: item.color, backgroundColor: `${item.color}20` }}>
              <i className={item.icon}></i>
            </div>
            <div className="card-info">
              <h3>{item.name}</h3>
              <p>{item.tables} Tables</p>
            </div>
            <button className="view-btn" style={{ borderColor: `${item.color}60`, color: item.color }}>
              {isLoading ? 'Loading...' : 'View Tables'} <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectSection;
