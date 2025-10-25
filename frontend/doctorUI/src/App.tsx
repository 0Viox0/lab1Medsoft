import { ThemeProvider } from "./modules/theme";
import { BrowserRouter, Route, Routes } from "react-router";
import { Sidebar } from "./modules/sidebar/Sidebar";
import { Redirect } from "./pages/Redirect";
import { Visits } from "./pages/Visits";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route index element={<Redirect to="/visits" />} />
          <Route element={<Sidebar appName="DoctorUI" />} path="/">
            <Route path="visits" element={<Visits />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
