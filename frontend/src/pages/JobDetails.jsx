import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';

const JobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJob();
  }, [id]);

  const fetchJob = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jobs/${id}`);
      setJob(response.data);
    } catch (err) {
      setError('Job not found');
      console.error('Error fetching job:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'jobseeker') {
      setError('Only job seekers can apply for jobs');
      return;
    }

    try {
      setApplying(true);
      await api.post(`/jobs/${id}/apply`, {
        coverLetter: `I am interested in the ${job.title} position at ${job.company}.`
      });
      setError('');
      alert('Application submitted successfully!');
      fetchJob(); // Refresh job data to show application
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply for job');
    } finally {
      setApplying(false);
    }
  };

  const hasApplied = user && job?.applications?.some(
    app => app.jobSeeker?._id === user._id || app.jobSeeker === user._id
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-2">{error}</div>
          <Button onClick={() => navigate('/jobs')}>
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Jobs
        </button>

        {/* Job Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {job.title}
              </h1>
              <p className="text-xl text-gray-700 mb-1">{job.company}</p>
              <p className="text-gray-500 flex items-center">
                📍 {job.location}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-2">
                {job.jobType}
              </span>
              {job.salary && (
                <p className="text-2xl font-bold text-gray-900">
                  ${job.salary.min?.toLocaleString()} - ${job.salary.max?.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {job.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {job.applications?.length || 0} applications
            </span>
          </div>

          {/* Apply Button */}
          {user?.role === 'jobseeker' && (
            <div className="mt-6">
              {hasApplied ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                  ✅ You have already applied for this position
                </div>
              ) : (
                <Button
                  onClick={handleApply}
                  loading={applying}
                  variant="primary"
                  size="large"
                >
                  Apply Now
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Job Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{job.requirements}</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Job Overview</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 text-sm">Posted</span>
                  <p className="font-medium">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Job Type</span>
                  <p className="font-medium">{job.jobType}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Category</span>
                  <p className="font-medium">{job.category}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Location</span>
                  <p className="font-medium">{job.location}</p>
                </div>
              </div>
            </div>

            {user?.role === 'employer' && job.employer?._id === user._id && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-4">Employer Actions</h3>
                <div className="space-y-2">
                  <Button variant="primary" className="w-full">
                    View Applications ({job.applications?.length || 0})
                  </Button>
                  <Button variant="outline" className="w-full">
                    Edit Job
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;