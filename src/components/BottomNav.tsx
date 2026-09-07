import { useLocation, NavLink } from 'react-router-dom';
import { Home, CalendarDays, DollarSign, Users2, UserCircle } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',                     icon: Home,         label: 'Início',     exact: true  },
  { to: '/leads',                icon: Users2,       label: 'Leads',      exact: false },
  { to: '/financeiro/agenda',    icon: CalendarDays, label: 'Agenda',     exact: false },
  { to: '/financeiro/dashboard', icon: DollarSign,   label: 'Financeiro', exact: false },
  { to: '/perfil',               icon: UserCircle,   label: 'Perfil',     exact: false },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden safe-area-inset-bottom">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors ${
                active ? 'text-primary' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              <span className={`text-[10px] font-medium leading-none ${active ? 'text-primary' : ''}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
