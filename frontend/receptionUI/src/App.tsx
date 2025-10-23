import { ThemeProvider } from "./modules/theme";
import { BrowserRouter, Route, Routes } from "react-router";
import { Sidebar } from "./modules/sidebar/Sidebar";
import { Add } from "./pages/Add";
import { Redirect } from "./pages/Redirect";
import { Delete } from "./pages/Delete";
import { RegisterVisit } from "./pages/RegisterVisit";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route index element={<Redirect />} />
          <Route element={<Sidebar appName="ReceptionUI" />} path="/">
            <Route path="add" element={<Add />} />
            <Route path="delete" element={<Delete />} />
            <Route path="registerVisit" element={<RegisterVisit />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
