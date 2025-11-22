import React, { useEffect } from "react";
import { useTabNavigator } from "../contexts/TabNavigatorContext";
import Profile from "./Profile";

const ProfileRoot: React.FC = () => {
  const { restoreScrollTop, rememberScrollTop } = useTabNavigator();

  useEffect(() => {
    restoreScrollTop("profile");
    return () => rememberScrollTop("profile");
  }, [restoreScrollTop, rememberScrollTop]);

  return <Profile />;
};

export default ProfileRoot;


