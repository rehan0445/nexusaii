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
      // Inside a tab, allow normal back behavior within stack
      // Enforce special behavior at tab roots
      const path = location.pathname;

      const atArenaRoot = path === "/arena" || path === "/arena/";
      const atCampusRoot = path === "/campus" || path === "/campus/";

      if (atArenaRoot || atCampusRoot) {
        // Back from non-Arena root goes to Arena
        selectRootTab("hangout");
        // push replacement handled in selectRootTab
        return;
      }

      // At arena root - handle double back to exit
      if (atArenaRoot) {
        const now = Date.now();
        if (now - lastBackPressRef.current < 1500) {
          // simulate app exit by navigating away or closing window; on web we do history.back twice
          window.close?.();
        } else {
          lastBackPressRef.current = now;
          // Ideally show a toast: "Press back again to exit"
        }
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [location.pathname, navigate, currentRootTab, selectRootTab]);
};

export default useAndroidBackHandler;


