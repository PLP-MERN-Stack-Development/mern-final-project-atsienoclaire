import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import Button from '../components/UI/Button';

const CreateJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    requirements: '',
    category: 'Technology',
    location: '',
    jobType: 'Full-time',
    salary: '' // Changed from object to simple number string
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data for API - convert salary to number and ensure all required fields
      const submitData = {
        ...formData,
        salary: formData.salary ? parseInt(formData.salary) : 0,
        // Add optional fields with defaults
        responsibilities: '', // Add this required field
        experienceLevel: 'Entry', // Add default experience level
        skills: [], // Add empty skills array
        benefits: [] // Add empty benefits array
      };

      console.log('📤 Submitting job data:', submitData);

      const response = await api.post('/jobs', submitData);
      
      if (response.data.success) {
        alert('🎉 Job posted successfully!');
        navigate('/dashboard');
      } else {
        alert('Failed to post job: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Job creation error:', error);
      console.error('Error response:', error.response?.data);
      
      // Show specific validation errors
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.join('\n• ');
        alert(`Validation errors:\n• ${errorMessages}`);
      } else {
        alert('Failed to post job: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Test with minimal data to debug
  const testDebugCreate = async () => {
    try {
      console.log('🧪 Testing debug create...');
      const response = await api.post('/jobs/debug-create');
      console.log('Debug create result:', response.data);
      alert('✅ Debug test passed! Check console for details.');
    } catch (error) {
      console.error('❌ Debug test failed:', error.response?.data);
      alert('❌ Debug test failed. Check console for errors.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Debug Section - Remove after testing */}
        <div className="mb-6 p-4 bg-yellow-100 rounded-lg border border-yellow-300">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-yellow-800">Debug Mode</h3>
              <p className="text-sm text-yellow-700">
                Test if job creation works with minimal data
              </p>
            </div>
            <button 
              onClick={testDebugCreate}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium"
            >
              🧪 Test Debug Create
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Post a New Job</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Title *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Senior Web Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company *
                </label>
                <input
                  type="text"
                  name="company"
                  required
                  value={formData.company}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Tech Corp Inc"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Job Description *
              </label>
              <textarea
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the job responsibilities, expectations, company culture, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum 50 characters recommended
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Requirements *
              </label>
              <textarea
                name="requirements"
                required
                rows={4}
                value={formData.requirements}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="List the required skills, experience, education, certifications, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Be specific about must-have qualifications
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Technology">Technology</option>
                  <option value="Business">Business</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Arts">Arts</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location *
                </label>
                <input
                  type="text"
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., New York, NY or Remote"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Type *
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Annual Salary (USD) *
              </label>
              <div className="mt-1">
                <input
                  type="number"
                  name="salary"
                  required
                  value={formData.salary}
                  onChange={handleChange}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 75000"
                  min="0"
                  step="1000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter the annual salary in USD (numbers only)
              </p>
            </div>

            {/* Optional Fields Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Experience Level
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel || 'Entry'}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior Level</option>
                    <option value="Executive">Executive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Responsibilities
                  </label>
                  <textarea
                    name="responsibilities"
                    rows={3}
                    value={formData.responsibilities || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Detailed day-to-day responsibilities..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                {loading ? 'Posting Job...' : 'Post Job'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;