import React from 'react';

function Step3ContactInfo({ formData, handleChange }) {
  return (
    <div>
      <h2>Step 3: Contact Information</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Parent's Name:</label><br />
        <input
          type="text"
          name="parentName"
          value={formData.parentName}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Email:</label><br />
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Phone Number:</label><br />
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  );
}

export default Step3ContactInfo;
