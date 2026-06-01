import React from 'react';
import './Sidebar.css';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = ({
  open = false,
  onClose,
  showCloseIcon = false
}) => {
  const location = useLocation();

  const rawUser =
    localStorage.getItem('dinezy_user');

  let user = null;
  try{
    user = rawUser ? JSON.parse(rawUser) : null;
  }
  catch{
    user = null;
  }

  const role = user?.role;

  const dashboardPath =
    role === 'OWNER'
      ? '/owner'
      : role === 'MANAGER'
        ? '/manager'
        : role === 'CAPTAIN'
          ? '/captain'
          : role === 'KITCHEN'
            ? '/kitchen'
            : '/';

  const kitchenDisplayPath =
    role === 'KITCHEN'
      ? '/kitchen'
      : '/kitchen-display';

  const shouldShowCloseIcon =
    typeof onClose === 'function' &&
    (showCloseIcon || open);

  const menuItems = [
    { name: 'Dashboard', icon: 'fa-solid fa-chart-line', path: dashboardPath },
    { name: 'POS Terminal', icon: 'fa-solid fa-desktop' },
    { name: 'Tables', icon: 'fa-solid fa-table-cells-large', path: '/tables' },
    { name: 'Kitchen Display', icon: 'fa-solid fa-utensils', path: kitchenDisplayPath },
    { name: 'Menu', icon: 'fa-solid fa-layer-group', path: '/menu' },
    { name: 'Inventory', icon: 'fa-solid fa-box' },
    { name: 'Customers', icon: 'fa-solid fa-users' },
    { name: 'Invoices', icon: 'fa-solid fa-file-invoice' },
    { name: 'GST Reports', icon: 'fa-solid fa-chart-bar' },
    { name: 'Data Import', icon: 'fa-solid fa-upload' },
   
  ];

  return (
    <>
      {open && (
        <div
          className="sidebar-overlay"
          onClick={() => {
            if(typeof onClose === 'function'){
              onClose();
            }
          }}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-box">
            <i className="fa-solid fa-shop"></i>
          </div>
          <div className="logo-text">
            <h2>Dinezy POS</h2>
            <p>RESTAURANT OS</p>
          </div>

          {shouldShowCloseIcon && (
            <button
              type="button"
              className="sidebar-close"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          )}
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {

            const isActiveByPath =
              item.path &&
              location.pathname === item.path;

            const className =
              `menu-item ${isActiveByPath ? 'active' : ''}`;

            if(item.path){
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={className}
                  onClick={() => {
                    if(typeof onClose === 'function'){
                      onClose();
                    }
                  }}
                >
                  <span className="icon">
                    <i className={item.icon}></i>
                  </span>
                  <span className="text">{item.name}</span>
                </NavLink>
              );
            }

            return (
              <div
                key={item.name}
                className={className}
              >
                <span className="icon">
                  <i className={item.icon}></i>
                </span>
                <span className="text">{item.name}</span>
              </div>
            );

          })}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
