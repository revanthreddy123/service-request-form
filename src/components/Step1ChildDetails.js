import React from 'react';

function Step1ChildDetails({ formData, handleChange }) {
  return (
    <div>
      <h2>Step 1: Child Details</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Child's Age:</label><br />
        <input
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Diagnosis:</label><br />
        <input
          type="text"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          placeholder="e.g., ADHD, Dyslexia"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Current School Type:</label><br />
        <label>
          <input
            type="radio"
            name="schoolType"
            value="Public"
            checked={formData.schoolType === 'Public'}
            onChange={handleChange}
          />
          Public
        </label>{' '}
        <label>
          <input
            type="radio"
            name="schoolType"
            value="Private"
            checked={formData.schoolType === 'Private'}
            onChange={handleChange}
          />
          Private
        </label>{' '}
        <label>
          <input
            type="radio"
            name="schoolType"
            value="Homeschool"
            checked={formData.schoolType === 'Homeschool'}
            onChange={handleChange}
          />
          Homeschool
        </label>
      </div>
    </div>
  );
}

export default Step1ChildDetails;
