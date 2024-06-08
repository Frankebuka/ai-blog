import React, { useState } from "react";
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import app from "../firebase/Config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();
  const auth = getAuth(app);

  const handleSignup = async (e) => {
    try {
      e.preventDefault();
      await createUserWithEmailAndPassword(auth, email, password);
      updateProfile(auth.currentUser, { displayName: name });
      navigate("/", { replace: true });
    } catch (error) {
      toast(error.code, { type: "error" });
    }
  };

  return (
    <form
      onSubmit={handleSignup}
      className="border p-3 bg-light mx-auto"
      style={{ maxWidth: 400, marginTop: 70 }}
    >
      <h1>Register</h1>
      <div className="form-group">
        <label>Name</label>
        <input
          type="text"
          className="form-control"
          placeholder="Enter your name"
          onChange={(e) => {
            setName(e.target.value);
          }}
        />
      </div>
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
      <button className="btn btn-primary" onClick={handleSignup}>
        Register
      </button>
    </form>
  );
};

export default Register;
