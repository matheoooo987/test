import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/invoices', label: 'Factures', icon: '🧾' },
  { to: '/clients', label: 'Clients', icon: '👥' },
  { to: '/settings', label: 'Paramètres', icon: '⚙️' },
];

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-100 flex flex-col min-h-screen shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">F</div>
          <div>
            <h1 className="font-bold text-gray-900 text-sm leading-tight">FreelanceFlow</h1>
            <p className="text-xs text-gray-400">Facturation Pro</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs font-semibold text-primary-700">💡 Astuce</p>
          <p className="text-xs text-gray-500 mt-1">Exportez vos factures en PDF et envoyez-les directement à vos clients !</p>
        </div>
      </div>
    </aside>
  );
}
