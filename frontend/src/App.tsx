import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import UploadPage from "./pages/UploadPage";
import JudgesPage from "./pages/JudgesPage";
import AssignPage from "./pages/AssignPage";
import RunPage from "./pages/RunPage";
import ResultsPage from "./pages/ResultsPage";

const App = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/judges" element={<JudgesPage />} />
        <Route path="/assign" element={<AssignPage />} />
        <Route path="/run" element={<RunPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </Layout>
  );
};

export default App;
