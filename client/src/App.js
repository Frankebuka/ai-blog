import Articles from "./components/Articles";
import AddArticles from "./components/AddArticles";
import NavBar from "./components/NavBar";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./auth/Register";
import Login from "./auth/Login";
import Article from "./components/Article";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import GenerateArticles from "./components/GenerateArticles";
import "./App.css";

function App() {
  return (
    <div className="container">
      <BrowserRouter>
        <NavBar />
        <ToastContainer position="top-right" />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/article/:id" element={<Article />} />
          <Route
            path="/"
            element={
              <div className="row" style={{ marginTop: 70 }}>
                <div className="col-md-8">
                  <Articles />
                </div>
                <div className="col-md-4">
                  <GenerateArticles />
                  <AddArticles />
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
