import React, { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import app from "../firebase/Config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const auth = getAuth(app);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    try {
      e.preventDefault();
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/", { replace: true });
    } catch (error) {
      toast(error.code, { type: "error" });
    }
  };

  return (
    <div
      className="border p-3 bg-light mx-auto"
      style={{ maxWidth: 400, marginTop: 70 }}
    >
      <h1>Login</h1>
      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          className="form-control"
          placeholder="Enter your email"
          onChange={(e) => {
            setEmail(e.target.value);
          }}
        />
      </div>
      <div className="form-group">
        <label>Password</label>
        <input
          type="password"
          className="form-control"
          placeholder="Password"
          onChange={(e) => {
            setPassword(e.target.value);
          }}
        />
      </div>
      <br />
      <button className="btn btn-primary" onClick={handleLogin}>
        Login
      </button>
    </div>
  );
};

export default Login;
