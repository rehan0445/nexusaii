import React, { useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useTabNavigator } from "../contexts/TabNavigatorContext";

const Campus: React.FC = () => {
  const { selectSubTab, restoreScrollTop, rememberScrollTop } = useTabNavigator();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes("/campus/info")) selectSubTab("campus.info");
    else if (location.pathname.includes("/campus/confessions")) selectSubTab("campus.confessions");
  }, [location.pathname, selectSubTab]);

  useEffect(() => {
    restoreScrollTop("campus");
    return () => rememberScrollTop("campus");
  }, [restoreScrollTop, rememberScrollTop]);

  return (
    <div className="max-w-5xl mx-auto px-4 min-h-[100dvh]">
      <div className="sticky top-0 z-10 bg-[#18181b]/80 backdrop-blur border-b border-zinc-800">
        <div className="flex gap-4">
          <NavLink to="/campus/info" className={({ isActive }) => `py-3 ${isActive ? "text-softgold-500" : "text-zinc-400"}`}>Info</NavLink>
          <NavLink to="/campus/confessions" className={({ isActive }) => `py-3 ${isActive ? "text-softgold-500" : "text-zinc-400"}`}>Confessions</NavLink>
        </div>
      </div>
      <div className="py-3 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default Campus;


