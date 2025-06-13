import React, { useState } from 'react';
import Step1ChildDetails from './Step1ChildDetails';
import Step2ServiceNeeds from './Step2ServiceNeeds';
import Step3ContactInfo from './Step3ContactInfo';
import FormNavigation from './FormNavigation';

function MultiStepForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    diagnosis: '',
    schoolType: '',
    supportTypes: [],
    frequency: '',
    requirements: '',
    parentName: '',
    email: '',
    phone: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);


  const [errorMessages, setErrorMessages] = useState([]);

  const stepTitles = ['Child Details', 'Service Needs', 'Contact Info'];
  const progressPercent = (currentStep / 3) * 100;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter((item) => item !== value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    let errors = [];

    if (currentStep === 1) {
      if (!formData.age) errors.push("Child's age is required.");
      if (!formData.diagnosis) errors.push('Diagnosis is required.');
      if (!formData.schoolType) errors.push('School type is required.');
    }

    if (currentStep === 2) {
      if (formData.supportTypes.length === 0)
        errors.push('Select at least one support type.');
      if (!formData.frequency) errors.push('Preferred frequency is required.');
    }

    if (currentStep === 3) {
      if (!formData.parentName) errors.push('Parent name is required.');
      if (!formData.email) {
        errors.push('Email is required.');
      } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
        errors.push('Enter a valid email address.');
      }

      if (!formData.phone) {
        errors.push('Phone number is required.');
      } else if (!/^\d{10}$/.test(formData.phone)) {
        errors.push('Phone number must be 10 digits.');
      }
    }

    return errors;
  };

  const nextStep = () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setErrorMessages(errors);
    } else {
      setErrorMessages([]);
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setErrorMessages([]);
    setCurrentStep((prev) => prev - 1);
  };

const handleSubmit = () => {
  const errors = validateForm();
  if (errors.length > 0) {
    setErrorMessages(errors);
  } else {
    setErrorMessages([]);
    console.log('✅ Final Form Data:', formData);
    setIsSubmitted(true);
  }
};


if (isSubmitted) {
  return (
    <div className="form-card">
      <h2>🎉 Thank You!</h2>
      <p>Your service request has been submitted successfully.</p>
      <p>We will contact you shortly.</p>
    </div>
  );
}


  return (

    <div className="form-card">
      {/* Step Indicator */}
      <div className="step-header">
        <p>
          <strong>Step {currentStep} of 3:</strong> {stepTitles[currentStep - 1]}
        </p>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Error Messages */}
      {errorMessages.length > 0 && (
        <div
          style={{
            background: '#fee2e2',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            color: '#b91c1c',
          }}
        >
          <ul>
            {errorMessages.map((msg, idx) => (
              <li key={idx}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form Step Content */}
      {currentStep === 1 && (
        <Step1ChildDetails formData={formData} handleChange={handleChange} />
      )}
      {currentStep === 2 && (
        <Step2ServiceNeeds formData={formData} handleChange={handleChange} />
      )}
      {currentStep === 3 && (
        <Step3ContactInfo formData={formData} handleChange={handleChange} />
      )}

      <FormNavigation
        currentStep={currentStep}
        nextStep={nextStep}
        prevStep={prevStep}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

export default MultiStepForm;
