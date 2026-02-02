import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTabNavigator } from "../contexts/TabNavigatorContext";

const isAndroid = () => /Android/i.test(navigator.userAgent);

export const useAndroidBackHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRootTab, selectRootTab } = useTabNavigator();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (!isAndroid()) return;

    const onPopState = () => {
      const path = location.pathname;

      // Darkroom chat -> Darkroom list -> Companion
      if (path.startsWith("/arena/darkroom/")) {
        navigate("/arena/darkroom");
        return;
      }

      if (path === "/arena/darkroom") {
        navigate("/companion");
        return;
      }

      // Campus confessions (any collegeId) -> companion (only general is valid)
      if (path.match(/^\/campus\/[^\/]+\/confessions/)) {
        navigate("/companion", { replace: true });
        return;
      }

      // Campus announcements -> companion
      if (path.match(/^\/campus\/[^\/]+\/announcements$/)) {
        navigate("/companion", { replace: true });
        return;
      }

      // Campus detail (/campus/:collegeId) -> companion (campus selection disabled)
      if (path.match(/^\/campus\/[^\/]+$/) && path !== "/campus") {
        navigate("/companion", { replace: true });
        return;
      }

      // /campus (disabled) -> Companion
      if (path === "/campus") {
        navigate("/companion", { replace: true });
        return;
      }

      // Profile -> Companion
      if (path === "/profile") {
        navigate("/companion", { replace: true });
        return;
      }

      // Hangout -> Companion
      if (path === "/arena/hangout") {
        navigate("/companion", { replace: true });
        return;
      }

      // At companion - handle double back to exit
      if (path === "/companion") {
        const now = Date.now();
        if (now - lastBackPressRef.current < 1500) {
          window.close?.();
        } else {
          lastBackPressRef.current = now;
          // Show toast: "Press back again to exit"
        }
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [location.pathname, navigate, currentRootTab, selectRootTab]);
};

export default useAndroidBackHandler;


