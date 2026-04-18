import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const UserMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const menuItems = [
    {
      label: 'Profile Settings',
      icon: '⚙️',
      onClick: () => {
        navigate('/profile');
        setIsOpen(false);
      }
    },
    {
      label: 'Connect Accounts',
      icon: '🔗',
      onClick: () => {
        navigate('/connections');
        setIsOpen(false);
      }
    },
    {
      label: 'Delete Account',
      icon: '🗑️',
      onClick: () => {
        navigate('/delete-account');
        setIsOpen(false);
      },
      danger: true
    },
    {
      label: 'Logout',
      icon: '🚪',
      onClick: handleLogout,
      separator: true
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* User Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <svg
          className={`w-4 h-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.email || 'User'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {user?.name || 'Experta User'}
            </p>
          </div>

          {/* Menu Items */}
          {menuItems.map((item, index) => (
            <div key={index}>
              {item.separator && <div className="border-t border-gray-200 my-1" />}
              <button
                onClick={item.onClick}
                className={`w-full text-left px-4 py-2 text-sm flex items-center space-x-3 transition-colors ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserMenu;
