// src/components/NewClientModal.jsx
import React, { useState } from "react";
import { supabase } from "../services/supabaseService";

export default function NewClientModal({ onClose, reloadClients }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    city: "",
    region: "",
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from("clients").insert([form]);
    if (error) {
      alert("Error: " + error.message);
    } else {
      alert("Client added!");
      reloadClients?.();
      onClose();
    }
  };

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalContent} onClick={(e) => e.stopPropagation()}>
        <h2>Add New Client</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <input name="first_name" placeholder="First Name" onChange={handleChange} style={inputStyle} required />
          <input name="last_name" placeholder="Last Name" onChange={handleChange} style={inputStyle} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} style={inputStyle} />
          <input name="phone" placeholder="Phone" onChange={handleChange} style={inputStyle} />
          <input name="city" placeholder="City" onChange={handleChange} style={inputStyle} />
          <input name="region" placeholder="Region" onChange={handleChange} style={inputStyle} />
          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
            <button type="submit" style={submitBtn}>Save</button>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 };
const modalContent = { background: "#fff", borderRadius: "0.5rem", width: "90%", maxWidth: "500px", padding: "1.5rem" };
const inputStyle = { padding: "0.5rem", border: "1px solid #706e6b", borderRadius: "0.25rem" };
const submitBtn = { background: "#0176d3", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };
const cancelBtn = { background: "#706e6b", color: "#fff", border: "none", padding: "0.5rem 1rem", borderRadius: "0.25rem", cursor: "pointer" };