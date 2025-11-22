import React, { useEffect } from "react";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import AiChat from "./AiChat";

const CompanionRoot: React.FC = () => {
  const { restoreScrollTop, rememberScrollTop } = useTabNavigator();

  useEffect(() => {
    restoreScrollTop("companion");
    return () => rememberScrollTop("companion");
  }, [restoreScrollTop, rememberScrollTop]);

  return (
    <div className="companion-theme min-h-[100dvh] bg-[#18181b]">
      {/* Use AiChat's built-in header to avoid double bars */}
      <AiChat />
    </div>
  );
};

export default CompanionRoot;


