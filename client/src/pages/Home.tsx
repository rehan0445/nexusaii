import { Navigate } from "react-router-dom";

// Home page has been removed - redirect to arena
function Home() {
  return <Navigate to="/arena" replace />;
}

export default Home;