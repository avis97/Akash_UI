import React from 'react';
import { Box, ChevronRight, ChevronDown } from 'lucide-react';

export default function Sidebar({ 
  navItems, 
  activeTab, 
  openMenus, 
  onToggleMenu, 
  onNavigate 
}) {
  const renderNavItem = (item, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isOpen = openMenus[item.id];

    const checkIsActive = (navItem) => {
      if (activeTab === navItem.id) return true;
      if (navItem.subItems) {
        return navItem.subItems.some(s => checkIsActive(s));
      }
      return false;
    };

    const isActive = checkIsActive(item);

    if (level === 0) {
      const Icon = item.icon || Box;
      return (
        <div key={item.id} className="nav-group">
          <div 
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => {
              if (hasSubItems) {
                onToggleMenu(item.id);
              } else {
                onNavigate(item.url, item.id);
              }
            }}
          >
            <div className="nav-icon-box">
              <Icon size={18} style={{ color: isActive ? '#ffffff' : '#475569' }} />
            </div>
            <span style={{ flex: 1, fontSize: '0.9rem' }}>{item.label}</span>
            {hasSubItems && (
              <div style={{ opacity: 0.7 }}>
                {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            )}
          </div>
          
          {hasSubItems && isOpen && (
            <div className="nav-submenu">
              {item.subItems.map(sub => renderNavItem(sub, level + 1))}
            </div>
          )}
        </div>
      );
    }

    const paddingLeftCalc = level > 1 ? `${(level - 1) * 1.1}rem` : '0px';

    return (
      <div key={item.id} className="nav-group" style={{ paddingLeft: paddingLeftCalc }}>
        <div 
          className={`nav-subitem ${isActive ? 'active' : ''}`}
          onClick={() => {
            if (hasSubItems) {
              onToggleMenu(item.id);
            } else {
              onNavigate(item.url, item.id);
            }
          }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="sub-ring-icon" style={{ transform: level > 1 ? 'scale(0.8)' : 'none' }} />
            <span style={{ fontSize: level > 1 ? '0.82rem' : '0.85rem' }}>{item.label}</span>
          </div>
          {hasSubItems && (
            <div style={{ opacity: 0.7 }}>
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </div>
          )}
        </div>

        {hasSubItems && isOpen && (
          <div className="nav-submenu">
            {item.subItems.map(sub => renderNavItem(sub, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="sidebar" style={{ width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
      <div className="brand-header" style={{ padding: '1.25rem 1rem', borderBottom: '1px solid #f1f5f9' }}>
        <img 
          src="https://blanchedalmond-bat-253605.hostingersite.com//storage/uploads/logo/2-logo-dark.png" 
          alt="Akash Engineering" 
          style={{ width: '100%', maxHeight: '55px', objectFit: 'contain' }} 
        />
      </div>

      <nav className="nav-menu" style={{ padding: '1rem 0.75rem' }}>
        {navItems.map(item => renderNavItem(item, 0))}
      </nav>
    </aside>
  );
}
