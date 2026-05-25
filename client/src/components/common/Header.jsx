import './Header.css';

import { useMemo, useState } from 'react';
import { Menu, Bell } from 'lucide-react'; // Premium React Icons
import { useNavigate } from 'react-router-dom';

const Header = ({
  title,
  user,
  onMenuClick,
  notifications = [],
  onClearNotifications,
  showLogout = true
}) => {

  const navigate = useNavigate();

  const currentDate = useMemo(() => {
    try{
      return new Intl.DateTimeFormat(
        'en-US',
        {
          year:'numeric',
          month:'numeric',
          day:'numeric'
        }
      ).format(new Date());
    }
    catch{
      return new Date().toLocaleDateString();
    }
  },[]);

  const list = useMemo(() => (
    Array.isArray(notifications) ? notifications : []
  ), [notifications]);

  const count = list.length;

  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  const handleLogout = () => {
    try{
      localStorage.removeItem('dinezy_token');
      localStorage.removeItem('dinezy_user');

      if(user?._id){
        localStorage.removeItem(`dinezy_notifications_${user._id}`);
      }
    }
    catch{
      // ignore
    }
    finally{
      setOpen(false);
      navigate('/', { replace:true });
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open menu"
          onClick={onMenuClick}
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>

        <div className="header-titles">
          <h1 className="header-title">
            {title}
          </h1>

          <p className="header-date">
            {currentDate}
          </p>
        </div>
      </div>

      <div className="header-right">
        <div className="notification-wrap">
          <div
            className={`notification-box ${count > 0 ? 'has-notifications' : ''}`}
            title="Notifications"
            onClick={toggle}
          >
            {count > 0 && (
              <span className="notification-count">
                {count}
              </span>
            )}
            <Bell size={20} strokeWidth={2.2} />
          </div>

          {open && (
            <div className="notification-panel" role="menu" aria-label="Notifications">
              <div className="notification-panel-top">
                <div className="notification-panel-title">Notifications</div>
                <button
                  type="button"
                  className="notification-clear"
                  onClick={() => {
                    if (typeof onClearNotifications === 'function') {
                      onClearNotifications();
                    }
                    setOpen(false);
                  }}
                >
                  Clear
                </button>
              </div>

              {count === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                <div className="notification-list">
                  {list.slice(0, 20).map((n) => (
                    <div key={n.id} className="notification-item">
                      <div className="notification-msg">{n.message}</div>
                      <div className="notification-meta">
                        {n.tableCode ? `Table ${n.tableCode}` : ''}
                        {n.tokenNumber ? (n.tableCode ? ' • ' : '') : ''}
                        {n.tokenNumber ? `KOT ${n.tokenNumber}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="profile-box">
          <div className="profile-image">
            {user?.name?.charAt(0) || 'A'}
          </div>

          <div className="profile-info">
            <h4>
              {user?.name || 'Admin'}
            </h4>
            <p>
              {user?.role || 'OWNER'}
            </p>
          </div>
        </div>

        {showLogout && (
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Header;
