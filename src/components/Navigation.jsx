import { NavLink } from 'react-router-dom';
import { FileText, Info, Settings2 } from 'lucide-react';

const links = [
  { to: '/', label: 'Notes', icon: FileText, end: true },
  { to: '/settings', label: 'Settings', icon: Settings2 },
  { to: '/about', label: 'About', icon: Info },
];

export default function Navigation({ position }) {
  return (
    <nav className={`navigation navigation-${position}`} aria-label="Main navigation">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
