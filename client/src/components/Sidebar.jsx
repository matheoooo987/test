import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/analytics', label: 'Analytiques', icon: '📈' },
  { to: '/invoices', label: 'Factures', icon: '🧾' },
  { to: '/quotes', label: 'Devis', icon: '📋' },
  { to: '/time', label: 'Temps', icon: '⏱️' },
  { to: '/expenses', label: 'Dépenses', icon: '💸' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' },
];

export default function Sidebar() {
  const { dark, toggle } = useTheme();
  return (
    <aside className="w-60 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col min-h-screen shadow-sm flex-shrink-0">
      <div className="p-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow">F</div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">FreelanceFlow</h1>
            <p className="text-xs text-gray-400">Facturation Pro</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <button
          onClick={toggle}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <span>{dark ? '☀️' : '🌙'}</span>
          {dark ? 'Mode clair' : 'Mode sombre'}
        </button>
      </div>
    </aside>
  );
}
