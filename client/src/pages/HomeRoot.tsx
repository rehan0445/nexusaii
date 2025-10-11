import { Navigate } from "react-router-dom";

// HomeRoot has been removed - redirect to arena
const HomeRoot: React.FC = () => {
  return <Navigate to="/arena" replace />;
};

export default HomeRoot;