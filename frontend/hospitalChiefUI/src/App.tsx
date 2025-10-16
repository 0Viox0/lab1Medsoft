import { ThemeProvider } from "./modules/theme";
import { BrowserRouter, Route, Routes } from "react-router";
import { Sidebar } from "./modules/sidebar/Sidebar";
import { Redirect } from "./pages/Redirect";
import { List } from "./pages/List";

// TODO: add popup to receive confirmation of patient deletion

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route index element={<Redirect to="/list" />} />
          <Route element={<Sidebar appName="HospitalChiefUI" />} path="/">
            <Route path="list" element={<List />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
