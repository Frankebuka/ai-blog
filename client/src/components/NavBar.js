import React from "react";
import { Link } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth, signOut } from "firebase/auth";
import app from "../firebase/Config";

const NavBar = () => {
  const auth = getAuth(app);
  const [user] = useAuthState(auth);

  return (
    <div className="fixed-top border" style={{ backgroundColor: "whitesmoke" }}>
      <nav className="navbar">
        <div>
          <img
            src="logo192.png"
            width={30}
            height={30}
            alt="logo"
            className="ms-5"
          />
        </div>
        <Link className="nav-link" to="/">
          Home
        </Link>
        <div>
          {user && (
            <>
              <span className="pe-4">
                Signed in as {user.displayName || user.email}
              </span>
              <button
                className="btn btn-primary btn-sm me-3"
                onClick={() => {
                  signOut(auth);
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
};

export default NavBar;
