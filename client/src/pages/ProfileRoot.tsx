import React, { useEffect } from "react";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import { PhoenixProfile } from "../components/PhoenixProfile";

const ProfileRoot: React.FC = () => {
  const { restoreScrollTop, rememberScrollTop } = useTabNavigator();

  useEffect(() => {
    restoreScrollTop("profile");
    return () => rememberScrollTop("profile");
  }, [restoreScrollTop, rememberScrollTop]);

  return <PhoenixProfile />;
};

export default ProfileRoot;


