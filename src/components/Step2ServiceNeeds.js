import React from 'react';

function Step2ServiceNeeds({ formData, handleChange }) {
  const supportOptions = ['Tutoring', 'Therapy', 'ADHD Coaching', 'Speech Support'];

  return (
    <div>
      <h2>Step 2: Service Needs</h2>

      <div style={{ marginBottom: '1rem' }}>
        <label>Type of Support Needed:</label><br />
        {supportOptions.map((option) => (
          <label key={option} style={{ display: 'block' }}>
            <input
              type="checkbox"
              name="supportTypes"
              value={option}
              checked={formData.supportTypes.includes(option)}
              onChange={handleChange}
            />
            {option}
          </label>
        ))}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Preferred Frequency:</label><br />
        <select
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
        >
          <option value="">-- Select --</option>
          <option value="Daily">Daily</option>
          <option value="Weekly">Weekly</option>
          <option value="Bi-weekly">Bi-weekly</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Any Specific Requirements:</label><br />
        <textarea
          name="requirements"
          rows="4"
          cols="40"
          value={formData.requirements}
          onChange={handleChange}
          placeholder="Describe any special needs or preferences"
        />
      </div>
    </div>
  );
}

export default Step2ServiceNeeds;
