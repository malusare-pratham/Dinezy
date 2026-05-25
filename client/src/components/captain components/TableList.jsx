import './TableList.css';
import { useEffect, useMemo, useState } from 'react';

const SECTION_LABELS = {
  HALL: 'Hall Section',
  AC: 'AC Section',
  FAMILY: 'Family Section',
  BAR: 'Bar Section'
};

const sectionPrefix = (section) => {
  switch(String(section || '').toUpperCase()){
    case 'HALL': return 'M';
    case 'AC': return 'A';
    case 'FAMILY': return 'F';
    case 'BAR': return 'B';
    default: return 'T';
  }
};

const statusClass = (status) => {
  switch(String(status || '').toUpperCase()){
    case 'AVAILABLE': return 'available';
    case 'RUNNING': return 'running';
    case 'OCCUPIED': return 'occupied';
    case 'BILLING': return 'billing';
    default: return 'available';
  }
};

const TableList = ({
  sectionKey,
  onBack,
  onSelectTable,
  captainId
}) => {
  const token = localStorage.getItem('dinezy_token');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTables = async () => {
    const res = await fetch(`${API_URL}/api/table/all`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || 'Failed to load tables');
    }
    setTables(data.tables || []);
  };

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      setIsLoading(true);
      try {
        await fetchTables();
      } catch (error) {
        alert(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token]);

  const visibleTables = useMemo(() => (
    (tables || [])
      .filter((t) => String(t.section || '').toUpperCase() === String(sectionKey || '').toUpperCase())
      .sort((a, b) => Number(a.tableNumber) - Number(b.tableNumber))
  ), [tables, sectionKey]);

  const getActiveCaptainId = (table) => (
    String(table?.activeCaptain?._id || table?.activeCaptain || '')
  );

  const canOpenTable = (table) => {
    const status = String(table?.status || '').toUpperCase();
    if (status === 'AVAILABLE') return true;
    if (!captainId) return false;
    return getActiveCaptainId(table) === String(captainId);
  };

  const getTableCode = (table) => (
    table?.code || `${sectionPrefix(table?.section)}-${table?.tableNumber}`
  );

  return (
    <div className="tablelist-container">
      <header className="tablelist-header">
        <div className="header-left">
          <p className="breadcrumb">FLOOR PLAN / SECTIONS</p>
          <h1>{SECTION_LABELS[String(sectionKey || '').toUpperCase()] || 'Section'}</h1>
          <p className="sub-text">Select a table to manage orders or view status</p>
        </div>
        <button className="back-sections-btn" onClick={onBack} disabled={isLoading}>
          <i className="fa-solid fa-chevron-left"></i> Back to Sections
        </button>
      </header>

      <div className="tablelist-grid">
        {visibleTables.map((table) => (
          <div
            key={table._id}
            className={`table-card-new ${statusClass(table.status)} ${canOpenTable(table) ? '' : 'locked'}`}
            onClick={() => {
              if (!canOpenTable(table)) return;
              onSelectTable?.(table);
            }}
          >
            {/* Top Glowing Indicator Line */}
            <div className="card-indicator"></div>
            
            <div className="card-main-content">
              <div className="card-top">
                <span className="t-name">{getTableCode(table)}</span>
                <span className={`s-badge ${statusClass(table.status)}`}>
                  {table.status}
                </span>
              </div>
              
              <div className="card-middle">
                <span className="seat-info">
                  <i className="fa-solid fa-chair"></i> {table.capacity} Seats
                </span>
              </div>

              <div className="card-bottom-empty">
                <span>
                  {isLoading ? 'Loading...' : (canOpenTable(table) ? 'Tap to open' : 'Assigned to another captain')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableList;
