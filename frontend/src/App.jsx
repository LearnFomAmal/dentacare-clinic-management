import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { setNavigator } from "./utils/navigation";

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  return <AppRoutes />;
}

export default App;