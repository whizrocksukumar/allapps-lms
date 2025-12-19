// src/components/EditClientModal.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseService";

export default function EditClientModal({ client, onClose, onSave }) {
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
    region: "",
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
  const [regionCode, setRegionCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load regions on mount
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const { data, error } = await supabase
          .from("regions")
          .select("region_code, region_name")
          .order("region_name");

        if (error) throw error;
        setRegions(data || []);
      } catch (err) {
        console.error("Error loading regions:", err);
      }
    };

    loadRegions();
  }, []);

  // Load cities when regionCode changes
  useEffect(() => {
    if (!regionCode) {
      setCities([]);
      return;
    }

    const loadCities = async () => {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("city_name")
          .eq("region_code", regionCode)
          .order("city_name");

        if (error) throw error;
        setCities(data || []);
      } catch (err) {
        console.error("Error loading cities:", err);
      }
    };

    loadCities();
  }, [regionCode]);

  // Initialize form with client data
  useEffect(() => {
    if (!client || regions.length === 0) return;

    setForm({
      id: client.id,
      first_name: client.first_name || "",
      last_name: client.last_name || "",
      email: client.email || "",
      client_type: client.client_type || "Individual",
      company_name: client.company_name || "",
      mobile_phone: client.mobile_phone || client.phone || "",
      work_phone: client.work_phone || "",
      home_phone: client.home_phone || "",
      address: client.address || "",
      city: client.city || "",
      region: client.region || "",
      postcode: client.postcode || "",
      country: client.country || "NZ",
      id_type: client.id_type || "",
      id_number: client.id_number || "",
      employment_status: client.employment_status || "",
      monthly_income: client.monthly_income || "",
      occupation: client.occupation || "",
      date_of_birth: client.date_of_birth || "",
      gender: client.gender || "",
      notes: client.notes || ""
    });

    // Find and set region code from region name
    if (client.region) {
      const foundRegion = regions.find(r => r.region_name === client.region);
      if (foundRegion) {
        setRegionCode(foundRegion.region_code);
      }
    }
  }, [client, regions]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = (e) => {
    const selectedCode = e.target.value;
    setRegionCode(selectedCode);
    
    // Update form with region name
    const selectedRegion = regions.find(r => r.region_code === selectedCode);
    setForm(prev => ({ 
      ...prev, 
      region: selectedRegion?.region_name || "",
      city: "" // Reset city when region changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError(null);

    // Validation
    if (!form.first_name || !form.last_name || !form.email || !form.client_type) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const dbPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        client_type: form.client_type,
        company_name: form.company_name || null,
        phone: form.mobile_phone,
        mobile_phone: form.mobile_phone,
        work_phone: form.work_phone,
        home_phone: form.home_phone,
        address: form.address,
        city: form.city,
        region: form.region,
        postcode: form.postcode,
        country: form.country,
        id_type: form.id_type || null,
        id_number: form.id_type ? form.id_number : null,
        employment_status: form.employment_status || null,
        occupation: ['employed', 'self_employed'].includes(form.employment_status) ? form.occupation : null,
        monthly_income: form.employment_status ? (parseFloat(form.monthly_income) || null) : null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender || null
      };

      const { error: updateError } = await supabase
        .from("clients")
        .update(dbPayload)
        .eq('id', form.id);

      if (updateError) throw updateError;

      alert("Client updated successfully!");
      
      if (onSave) {
        onSave({ ...dbPayload, id: form.id });
      }
      
      onClose();

    } catch (err) {
      console.error("Error updating client:", err);
      setError(err.message || "Failed to update client");
    } finally {
      setLoading(false);
    }
  };

  if (!client) return null;

  return (
    <div style={modalOverlay} onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    }}>
      <div style={modalContent} onMouseDown={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, color: '#0176d3' }}>Edit Client</h2>
          <button onClick={onClose} style={closeXStyle}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          {/* SECTION 1: BASIC INFO */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Basic Information <span style={{ color: 'red' }}>*</span></h4>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>First Name *</label>
                <input name="first_name" value={form.first_name} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Last Name *</label>
                <input name="last_name" value={form.last_name} onChange={handleChange} style={inputStyle} required />
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} style={inputStyle} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Client Type *</label>
                <select name="client_type" value={form.client_type} onChange={handleChange} style={inputStyle} required>
                  <option value="Individual">Individual</option>
                  <option value="Business">Business</option>
                  <option value="Trust">Trust</option>
                </select>
              </div>
            </div>
            {form.client_type === 'Business' && (
              <div style={{ marginTop: '0.75rem' }}>
                <label style={labelStyle}>Company Name</label>
                <input name="company_name" value={form.company_name} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
              </div>
            )}
          </div>

          {/* SECTION 2: CONTACT */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Contact Details</h4>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Mobile Phone</label>
                <input name="mobile_phone" value={form.mobile_phone} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Work Phone</label>
                <input name="work_phone" value={form.work_phone} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Home Phone</label>
              <input name="home_phone" value={form.home_phone} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div style={{ marginBottom: '0.75rem' }}>
              <label style={labelStyle}>Address</label>
              <input name="address" value={form.address} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Region</label>
                <select 
                  name="region" 
                  value={regionCode} 
                  onChange={handleRegionChange} 
                  style={inputStyle}
                >
                  <option value="">Select Region...</option>
                  {regions.map(r => (
                    <option key={r.region_code} value={r.region_code}>
                      {r.region_name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>City</label>
                <select 
                  name="city" 
                  value={form.city} 
                  onChange={handleChange} 
                  style={inputStyle}
                  disabled={!regionCode}
                >
                  <option value="">Select City...</option>
                  {cities.map(c => (
                    <option key={c.city_name} value={c.city_name}>
                      {c.city_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Postcode</label>
                <input name="postcode" value={form.postcode} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Country</label>
                <select name="country" value={form.country} onChange={handleChange} style={inputStyle}>
                  <option value="NZ">New Zealand</option>
                  <option value="AU">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: ID & EMPLOYMENT */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Identity & Employment</h4>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Identification Type</label>
              <select name="id_type" value={form.id_type} onChange={handleChange} style={{ ...inputStyle, width: '100%', marginBottom: '0.5rem' }}>
                <option value="">Select ID Type...</option>
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID</option>
                <option value="other">Other</option>
              </select>
              {form.id_type && (
                <div>
                  <label style={labelStyle}>ID Number</label>
                  <input name="id_number" value={form.id_number} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                </div>
              )}
            </div>

            <div>
              <label style={labelStyle}>Employment Status</label>
              <select name="employment_status" value={form.employment_status} onChange={handleChange} style={{ ...inputStyle, width: '100%', marginBottom: '0.5rem' }}>
                <option value="">Select Employment Status...</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="unemployed">Unemployed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
              </select>

              {['employed', 'self_employed'].includes(form.employment_status) && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={labelStyle}>Occupation / Role</label>
                  <input name="occupation" value={form.occupation} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                </div>
              )}

              {form.employment_status && (
                <div>
                  <label style={labelStyle}>Monthly Income ($)</label>
                  <input name="monthly_income" type="number" step="0.01" value={form.monthly_income} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 4: PERSONAL */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Personal Details</h4>
            <div style={rowStyle}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Date of Birth</label>
                <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} style={{ ...inputStyle, width: '100%' }}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: NOTES */}
          <div style={sectionStyle}>
            <h4 style={sectionHeader}>Notes</h4>
            <textarea
              name="notes"
              placeholder="Additional notes about the client..."
              value={form.notes}
              onChange={handleChange}
              style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: 'red', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</div>}

          <div style={footerStyle}>
            <button type="button" onClick={onClose} style={cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={submitBtn}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Styles
const modalOverlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000 };
const modalContent = { background: "#fff", borderRadius: "8px", width: "95%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 10px 25px rgba(0,0,0,0.2)" };
const headerStyle = { padding: "1.5rem", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" };
const closeXStyle = { background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#666" };
const formStyle = { padding: "1.5rem", overflowY: "auto" };
const sectionStyle = { marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0f0f0" };
const sectionHeader = { marginTop: 0, marginBottom: "1rem", color: "#444", fontSize: "1rem", fontWeight: 600 };
const rowStyle = { display: "flex", gap: "1rem", marginBottom: "0.75rem" };
const inputStyle = { width: '100%', padding: "0.6rem", border: "1px solid #ddd", borderRadius: "4px", fontSize: "0.9rem", fontFamily: 'inherit', boxSizing: 'border-box' };
const labelStyle = { display: "block", fontSize: "0.8rem", color: "#666", marginBottom: "0.25rem" };
const footerStyle = { display: "flex", gap: "1rem", justifyContent: "flex-end", borderTop: "1px solid #eee", paddingTop: "1rem" };
const submitBtn = { background: "#0176d3", color: "#fff", border: "none", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 600 };
const cancelBtn = { background: "#f3f3f3", color: "#333", border: "1px solid #ccc", padding: "0.75rem 1.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 500 };