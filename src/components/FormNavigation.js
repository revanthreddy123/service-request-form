import React from 'react';

function FormNavigation({ currentStep, nextStep, prevStep, handleSubmit }) {
  return (
    <div style={{ marginTop: '2rem' }}>
      {currentStep > 1 && (
        <button onClick={prevStep} style={{ marginRight: '1rem' }}>
          ⬅ Back
        </button>
      )}

      {currentStep < 3 && (
        <button onClick={nextStep}>
          Next ➡
        </button>
      )}

      {currentStep === 3 && (
        <button onClick={handleSubmit}>
          ✅ Submit
        </button>
      )}
    </div>
  );
}

export default FormNavigation;
