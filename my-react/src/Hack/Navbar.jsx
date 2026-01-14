import React from "react";
import { NavLink } from "react-router-dom";
// DO NOT import CSS here. It is handled in main.jsx

export default function Navbar() {
  return (
    <nav className="navbar">
      <NavLink to="/" end className="nav-link">
        Simulator
      </NavLink>
      <NavLink to="/architecture" className="nav-link">
        Architecture
      </NavLink>
      <NavLink to="/about" className="nav-link">
        About
      </NavLink>
       <NavLink to="/qc" className="nav-link">
        QC Resources
      </NavLink>
    </nav>
  );
}