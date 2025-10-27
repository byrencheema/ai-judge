import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import UploadPage from "./pages/UploadPage";
import JudgesPage from "./pages/JudgesPage";
import WorkflowPage from "./pages/WorkflowPage";
import ResultsPage from "./pages/ResultsPage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><UploadPage /></Layout>} />
      <Route path="/judges" element={<Layout><JudgesPage /></Layout>} />
      <Route path="/workflow" element={<WorkflowPage />} />
      <Route path="/results" element={<Layout><ResultsPage /></Layout>} />
    </Routes>
  );
};

export default App;
