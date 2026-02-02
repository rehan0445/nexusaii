import React, { useEffect } from "react";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import { PhoenixCharactersPage } from "../components/PhoenixCharactersPage";

const CompanionRoot: React.FC = () => {
  const { restoreScrollTop, rememberScrollTop } = useTabNavigator();

  useEffect(() => {
    restoreScrollTop("companion");
    return () => rememberScrollTop("companion");
  }, [restoreScrollTop, rememberScrollTop]);

  return <PhoenixCharactersPage />;
};

export default CompanionRoot;


