import React, { useState } from 'react';
import './ReportIssue.css';

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    issueType: '',
    subject: '',
    description: '',
    orderNumber: '',
    attachments: [],
    email: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const issueTypes = [
    'Order Issue',
    'Product Defect',
    'Delivery Problem',
    'Website Bug',
    'Account Problem',
    'Billing Issue',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files].slice(0, 3) // Limit to 3 files
    }));
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.issueType) newErrors.issueType = 'Please select an issue type';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form submitted:', formData);
      setSubmitted(true);
      // Reset form
      setFormData({
        issueType: '',
        subject: '',
        description: '',
        orderNumber: '',
        attachments: [],
        email: '',
      });
    } catch (error) {
      console.error('Error submitting report:', error);
      alert('Failed to submit your report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewReport = () => {
    setSubmitted(false);
  };

  return (
    <div className="report-issue-container">
      <h1>Report an Issue</h1>
      
      {submitted ? (
        <div className="success-message">
          <div className="success-icon">✓</div>
          <h2>Thank you for your report!</h2>
          <p>We've received your issue report and will look into it as soon as possible.</p>
          <p>If you provided an email, we'll contact you with updates.</p>
          <button className="primary-button" onClick={handleNewReport}>Submit Another Report</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="report-form">
          <div className="form-group">
            <label htmlFor="issueType">Issue Type*</label>
            <select 
              id="issueType" 
              name="issueType" 
              value={formData.issueType} 
              onChange={handleChange}
              className={errors.issueType ? 'error' : ''}
            >
              <option value="">Select Issue Type</option>
              {issueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {errors.issueType && <span className="error-text">{errors.issueType}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="orderNumber">Order Number (if applicable)</label>
            <input 
              type="text" 
              id="orderNumber" 
              name="orderNumber" 
              placeholder="e.g., ORD-123456" 
              value={formData.orderNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address*</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="your@email.com" 
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject*</label>
            <input 
              type="text" 
              id="subject" 
              name="subject" 
              placeholder="Brief description of the issue" 
              value={formData.subject}
              onChange={handleChange}
              className={errors.subject ? 'error' : ''}
            />
            {errors.subject && <span className="error-text">{errors.subject}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description*</label>
            <textarea 
              id="description" 
              name="description" 
              placeholder="Please provide details about your issue..." 
              value={formData.description}
              onChange={handleChange}
              rows={5}
              className={errors.description ? 'error' : ''}
            ></textarea>
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label>Attachments (Optional - Max 3 files)</label>
            <div className="file-upload">
              <input 
                type="file" 
                id="attachments" 
                multiple 
                onChange={handleFileChange} 
                disabled={formData.attachments.length >= 3}
              />
              <label htmlFor="attachments" className={formData.attachments.length >= 3 ? 'disabled' : ''}>
                {formData.attachments.length >= 3 ? 'Maximum files added' : 'Choose Files'}
              </label>
            </div>
            
            {formData.attachments.length > 0 && (
              <div className="attachment-list">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span>{file.name}</span>
                    <button 
                      type="button" 
                      className="remove-btn" 
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button 
              type="submit" 
              className="primary-button" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportIssue;