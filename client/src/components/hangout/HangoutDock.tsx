import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Users2, MessageCircle } from "lucide-react";

const navItems = [
  { key: 'home', icon: Home, to: '/arena/hangout', label: 'Hangout' },
  { key: 'groups', icon: Users2, to: '/arena/groups', label: 'Groups' },
  { key: 'darkroom', icon: MessageCircle, to: '/arena/darkroom', label: 'DarkRoom' },
];

const HangoutDock: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="hangout-dock">
      <div className="hangout-dock-inner">
        {navItems.map(({ key, icon: Icon, to, label }) => {
          const active = location.pathname.startsWith(to);
          return (
            <button
              key={key}
              className="hangout-dock-btn"
              aria-current={active}
              onClick={() => navigate(to)}
              title={label}
            >
              <Icon className={`w-5 h-5 ${active ? 'hangout-icon-active' : 'hangout-icon'}`} />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default HangoutDock;


