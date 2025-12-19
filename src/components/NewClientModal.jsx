// src/components/NewClientModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";

export default function NewClientModal({ onClose, reloadClients }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    client_type: "Individual",
    company_name: "",
    mobile_phone: "",
    work_phone: "",
    home_phone: "",
    address: "",
    city: "",
    region: "", // will store region_code
    postcode: "",
    country: "NZ",
    id_type: "",
    id_number: "",
    employment_status: "",
    monthly_income: "",
    occupation: "",
    date_of_birth: "",
    gender: "",
    notes: ""
  });

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* -----------------------------
     Load regions on mount
  ----------------------------- */
  useEffect(() => {
    const loadRegions = async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("region_code, region_name")
        .order("region_name");

      if (!error) setRegions(data || []);
    };

    loadRegions();
  }, []);

  /* -----------------------------
     Load cities when region changes
  ----------------------------- */
  useEffect(() => {
    if (!form.region) {
      setCities([]);
      setForm(prev => ({ ...prev, city: "" }));
      return;
    }

    const loadCities = async () => {
      const { data, error } = await supabase
        .from("cities")
        .select("city_name")
        .eq("region_code", form.region)
        .order("city_name");

      if (!error) setCities(data || []);
    };

    loadCities();
  }, [form.region]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* -----------------------------
     Submit handler
  ----------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!form.first_name || !form.last_name || !form.email) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    if (form.client_type === "Business" && !form.company_name) {
      setError("Company Name is required for Business clients.");
      setLoading(false);
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("clients")
        .select("id")
        .eq("email", form.email)
        .maybeSingle();

      if (existing) {
        throw new Error("A client with this email already exists.");
      }

      const selectedRegion = regions.find(
        r => r.region_code === form.region
      );

      const dbPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        client_type: form.client_type,
        company_name: form.client_type === "Business" ? form.company_name : null,
        phone: form.mobile_phone,
        mobile_phone: form.mobile_phone,
        work_phone: form.work_phone,
        home_phone: form.home_phone,
        address: form.address,
        city: form.city,
        region: selectedRegion?.region_name || null,
        postcode: form.postcode,
        country: form.country,
        id_type: form.id_type || null,
        id_number: form.id_type ? form.id_number : null,
        employment_status: form.employment_status || null,
        occupation: ["employed", "self_employed"].includes(form.employment_status)
          ? form.occupation
          : null,
        monthly_income: form.employment_status
          ? parseFloat(form.monthly_income) || null
          : null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null,
        notes: form.notes || null,
        status: "active"
      };

      const { error: insertError } = await supabase
        .from("clients")
        .insert([dbPayload]);

      if (insertError) throw insertError;

      alert("Client added successfully!");
      reloadClients?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={modalOverlay} onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={modalContent} onMouseDown={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: "#0176d3" }}>Add New Client</h2>
          <button onClick={onClose} style={closeXStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* BASIC INFO */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Basic Information *</h4>
            <div style={rowStyle}>
              <input name="first_name" placeholder="First Name *" value={form.first_name} onChange={handleChange} style={inputStyle} required />
              <input name="last_name" placeholder="Last Name *" value={form.last_name} onChange={handleChange} style={inputStyle} required />
            </div>
            <div style={rowStyle}>
              <input name="email" type="email" placeholder="Email *" value={form.email} onChange={handleChange} style={inputStyle} required />
              <select name="client_type" value={form.client_type} onChange={handleChange} style={inputStyle}>
                <option value="Individual">Individual</option>
                <option value="Business">Business</option>
                <option value="Trust">Trust</option>
              </select>
            </div>
            {form.client_type === "Business" && (
              <input
                name="company_name"
                placeholder="Company Name *"
                value={form.company_name}
                onChange={handleChange}
                style={{ ...inputStyle, width: "100%", marginTop: "0.75rem" }}
                required
              />
            )}
          </div>

          {/* CONTACT */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Contact Details</h4>
            <div style={rowStyle}>
              <input name="mobile_phone" placeholder="Mobile Phone" value={form.mobile_phone} onChange={handleChange} style={inputStyle} />
              <input name="work_phone" placeholder="Work Phone" value={form.work_phone} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <input name="home_phone" placeholder="Home Phone" value={form.home_phone} onChange={handleChange} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <input name="address" placeholder="Address" value={form.address} onChange={handleChange} style={{ ...inputStyle, width: "100%" }} />
            </div>

            {/* REGION + CITY DROPDOWNS */}
            <div style={rowStyle}>
              <select name="region" value={form.region} onChange={handleChange} style={inputStyle} required>
                <option value="">Select Region...</option>
                {regions.map(r => (
                  <option key={r.region_code} value={r.region_code}>
                    {r.region_name}
                  </option>
                ))}
              </select>

              <select name="city" value={form.city} onChange={handleChange} style={inputStyle} disabled={!form.region} required>
                <option value="">Select City...</option>
                {cities.map(c => (
                  <option key={c.city_name} value={c.city_name}>
                    {c.city_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={rowStyle}>
              <input name="postcode" placeholder="Postcode" value={form.postcode} onChange={handleChange} style={inputStyle} />
              <select name="country" value={form.country} onChange={handleChange} style={inputStyle}>
                <option value="NZ">New Zealand</option>
                <option value="AU">Australia</option>
              </select>
            </div>
          </div>

          {/* NOTES */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Notes</h4>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              style={{ ...inputStyle, width: "100%", minHeight: "80px" }}
            />
          </div>

          {error && <div style={{ color: "red" }}>{error}</div>}

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -----------------------------
   Styles
----------------------------- */
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const modalContent = { background: "#fff", borderRadius: "8px", width: "95%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const headerStyle = { padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" };
const closeXStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" };
const formStyle = { padding: "1.5rem", overflowY: "auto" };
const sectionStyle = { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0f0f0" };
const sectionHeader = { marginTop: 0, marginBottom: "1rem", color: "#444", fontSize: "1rem", fontWeight: 600 };
const rowStyle = { display: "flex", gap: "1rem", marginBottom: "0.75rem" };
const inputStyle = { flex: 1, padding: "0.6rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "0.9rem", fontFamily: 'inherit', boxSizing: 'border-box' };
const footerStyle = { display: "flex", justifyContent: "flex-end", gap: "1rem", borderTop: "1px solid #eee", paddingTop: "1rem" };
const submitBtn = { background: "#0176d3", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "4px", border: "none", cursor: "pointer", fontWeight: 600 };
const cancelBtn = { background: "#f3f3f3", color: "#333", border: "1px solid #ccc", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500 };