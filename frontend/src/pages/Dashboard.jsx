import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Button from '../components/UI/Button';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userJobs, setUserJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  // Extract the actual user data from the response structure
  const actualUser = user?.user || user;

  // Add debug logging
  useEffect(() => {
    console.log('🔍 Dashboard User Debug:');
    console.log('Full user object:', user);
    console.log('Actual user data:', actualUser);
    console.log('User role:', actualUser?.role);
    console.log('User ID:', actualUser?._id);
  }, [user, actualUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [actualUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching dashboard data for role:', actualUser?.role);
      
      if (actualUser?.role === 'employer') {
        console.log('📊 Fetching employer data...');
        // Fetch employer's jobs and applications
        const jobsResponse = await api.get('/jobs/my-jobs');
        console.log('Employer jobs API response:', jobsResponse.data);
        
        // Handle different response structures
        const jobsData = jobsResponse.data.data || jobsResponse.data.jobs || jobsResponse.data || [];
        console.log('Processed employer jobs:', jobsData);
        setUserJobs(jobsData);
        
        // Calculate stats for employer
        const totalJobs = jobsData.length || 0;
        const totalApplications = jobsData.reduce(
          (acc, job) => acc + (job.applications?.length || 0), 0
        ) || 0;
        
        setStats({ totalJobs, totalApplications });
        
      } else if (actualUser?.role === 'jobseeker') {
        console.log('👤 Fetching jobseeker data...');
        // Fetch available jobs for job seeker
        const jobsResponse = await api.get('/jobs');
        console.log('Available jobs API response:', jobsResponse.data);
        
        const jobsData = jobsResponse.data.data || jobsResponse.data.jobs || jobsResponse.data || [];
        console.log('Processed available jobs:', jobsData);
        setAvailableJobs(jobsData);
        
        // Fetch job seeker's applications
        try {
          const applicationsResponse = await api.get('/jobs/my-applications');
          console.log('Applications API response:', applicationsResponse.data);
          
          const applicationsData = applicationsResponse.data.data || applicationsResponse.data.applications || applicationsResponse.data || [];
          console.log('Processed applications:', applicationsData);
          setApplications(applicationsData);
          
          // Calculate stats for job seeker
          const totalApplications = applicationsData.length || 0;
          const pendingApplications = applicationsData.filter(
            app => app.status === 'pending'
          ).length || 0;
          
          setStats({ totalApplications, pendingApplications });
        } catch (appError) {
          console.log('❌ Applications endpoint error:', appError);
          console.log('This might be normal if no applications exist yet');
          setApplications([]);
          setStats({ totalApplications: 0, pendingApplications: 0 });
        }
      } else {
        console.log('❓ Unknown user role:', actualUser?.role);
        console.log('Available user data:', actualUser);
      }
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced apply function with better error handling
  const handleApplyJob = async (jobId) => {
    try {
      console.log('🚀 Applying for job:', jobId);
      console.log('Current user:', actualUser);
      
      // Test the apply route first to see what's wrong
      console.log('🧪 Testing apply route first...');
      try {
        const testResponse = await api.post(`/jobs/test-apply/${jobId}`, {
          coverLetter: 'Test cover letter for debugging'
        });
        console.log('✅ Test apply result:', testResponse.data);
      } catch (testError) {
        console.log('❌ Test apply failed:', testError.response?.data);
      }

      // Now try the actual apply
      const result = await api.post(`/jobs/${jobId}/apply`, {
        coverLetter: 'I am interested in this position and believe my skills are a great match for this role. I am excited about the opportunity to contribute to your team and grow professionally.'
      });
      
      console.log('✅ Apply response:', result.data);
      
      if (result.data.success) {
        alert('🎉 Application submitted successfully!');
        // Refresh the data to show the updated application status
        fetchDashboardData();
      } else {
        alert('Application failed: ' + (result.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Apply error details:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to apply for job. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errors && errorData.errors.length > 0) {
          errorMessage = errorData.errors.join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert('❌ ' + errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {actualUser?.role === 'employer' ? 'Employer Dashboard' : 'Job Seeker Dashboard'}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {actualUser?.name}
          </p>
          <div className="mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
              {actualUser?.role}
            </span>
          </div>
        </div>

        {/* Role-based Dashboard Content */}
        {actualUser?.role === 'employer' ? (
          <EmployerDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userJobs={userJobs}
            stats={stats}
            onRefresh={fetchDashboardData}
          />
        ) : (
          <JobSeekerDashboard
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            availableJobs={availableJobs}
            applications={applications}
            stats={stats}
            onApplyJob={handleApplyJob}
            onRefresh={fetchDashboardData}
          />
        )}
      </div>
    </div>
  );
};

// Employer Dashboard Component
const EmployerDashboard = ({ activeTab, setActiveTab, userJobs, stats, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {['overview', 'my-jobs', 'applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalJobs || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">📨</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <span className="text-2xl">⭐</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {userJobs.filter(job => job.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You have posted <strong>{stats.totalJobs || 0}</strong> jobs and received{' '}
              <strong>{stats.totalApplications || 0}</strong> applications in total.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Link to="/jobs/new">
                  <Button variant="primary" size="small">
                    Post New Job
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-jobs' && <EmployerJobsTab jobs={userJobs} />}
        {activeTab === 'applications' && <ApplicationsTab jobs={userJobs} />}
      </div>
    </div>
  );
};

// Job Seeker Dashboard Component
const JobSeekerDashboard = ({ activeTab, setActiveTab, availableJobs, applications, stats, onApplyJob, onRefresh }) => {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          {['overview', 'browse-jobs', 'my-applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Applications Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Jobs</p>
                <p className="text-2xl font-bold text-gray-900">{availableJobs.length || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              You have submitted <strong>{stats.totalApplications || 0}</strong> job applications.
              {stats.pendingApplications > 0 && (
                <> <strong>{stats.pendingApplications}</strong> of them are still pending review.</>
              )}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Next Steps</h3>
              <ul className="list-disc list-inside space-y-1 text-green-700">
                <li>Complete your profile to attract employers</li>
                <li>Browse new job opportunities</li>
                <li>Follow up on pending applications</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'browse-jobs' && (
          <BrowseJobsTab jobs={availableJobs} onApplyJob={onApplyJob} />
        )}
        {activeTab === 'my-applications' && <MyApplicationsTab applications={applications} />}
      </div>
    </div>
  );
};

// Tab Components
const EmployerJobsTab = ({ jobs }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">My Job Postings</h2>
        <Link to="/jobs/new">
          <Button variant="primary">
            Post New Job
          </Button>
        </Link>
      </div>
      
      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">You haven't posted any jobs yet.</p>
          <Link to="/jobs/new">
            <Button variant="primary">
              Post Your First Job
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{job.title}</h3>
                  <p className="text-gray-600">{job.company} • {job.location}</p>
                  <div className="flex space-x-2 mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {job.jobType}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      {job.applications?.length || 0} applications
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      job.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="small">
                    Edit
                  </Button>
                  <Button variant="primary" size="small">
                    View Applications ({job.applications?.length || 0})
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const BrowseJobsTab = ({ jobs, onApplyJob }) => {
  const { user } = useAuth();
  
  // Extract the actual user data from the response structure
  const actualUser = user?.user || user;

  // Safe salary display function
  const formatSalary = (salary) => {
    if (!salary) return 'Salary not specified';
    
    // Handle simple number salary
    if (typeof salary === 'number') {
      return `$${salary.toLocaleString()}`;
    }
    
    // Handle object salary (min/max)
    if (salary && typeof salary === 'object') {
      if (salary.min !== undefined && salary.max !== undefined) {
        return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
      } else if (salary.min !== undefined) {
        return `$${salary.min.toLocaleString()}+`;
      } else if (salary.max !== undefined) {
        return `Up to $${salary.max.toLocaleString()}`;
      }
    }
    
    return 'Salary not specified';
  };

  const hasApplied = (job) => {
    if (!job.applications || !actualUser) return false;
    
    console.log('🔍 Checking if user applied to job:', job._id);
    console.log('Job applications:', job.applications);
    console.log('Current user ID:', actualUser._id);
    
    // Check if current user has applied to this job
    const applied = job.applications.some(app => {
      const jobSeekerId = app.jobSeeker?._id || app.jobSeeker;
      console.log('Comparing:', jobSeekerId, 'with', actualUser._id);
      return jobSeekerId === actualUser._id;
    });
    
    console.log('Has applied result:', applied);
    return applied;
  };

  // Test function to debug a specific job
  const debugJob = (job) => {
    console.log('🐛 Debug job:', job);
    console.log('Job applications:', job.applications);
    console.log('Current user:', actualUser);
    console.log('Has applied result:', hasApplied(job));
    console.log('Job salary:', job.salary, 'Type:', typeof job.salary);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Available Jobs</h2>
      
      {/* Debug button - remove after testing */}
      {jobs.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-100 rounded-lg">
          <p className="text-sm text-yellow-800">
            🐛 Debug: {jobs.length} jobs loaded. Check console for details.
          </p>
          <button 
            onClick={() => debugJob(jobs[0])}
            className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm"
          >
            Debug First Job
          </button>
        </div>
      )}
      
      {jobs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No jobs available at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{job.title}</h3>
                  <p className="text-gray-700 font-medium">{job.company}</p>
                  <p className="text-gray-500 text-sm mt-1">📍 {job.location}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {job.jobType}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      {job.category}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      {formatSalary(job.salary)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mt-3 line-clamp-2">{job.description}</p>
                  
                  <div className="mt-3 text-sm text-gray-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col items-end space-y-2 min-w-[120px]">
                  {hasApplied(job) ? (
                    <div className="text-center">
                      <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        ✅ Applied
                      </span>
                      <p className="text-xs text-gray-500 mt-1">Already submitted</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Button
                        onClick={() => {
                          console.log('🎯 Apply button clicked for job:', job._id);
                          onApplyJob(job._id);
                        }}
                        variant="primary"
                        className="whitespace-nowrap"
                      >
                        ✨ Apply Now
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">One-click application</p>
                    </div>
                  )}
                  <Link 
                    to={`/jobs/${job._id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Applications Tab for Employers
const ApplicationsTab = ({ jobs }) => {
  const allApplications = jobs.flatMap(job => 
    (job.applications || []).map(app => ({ ...app, jobTitle: job.title, jobId: job._id }))
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Job Applications</h2>
      
      {allApplications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No applications received yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allApplications.map((application, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{application.jobTitle}</h3>
                  <p className="text-gray-600">
                    Applicant: {application.jobSeeker?.name || 'Unknown'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Email: {application.jobSeeker?.email || 'No email provided'}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Applied on {new Date(application.appliedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Pending'}
                    </span>
                  </div>
                  {application.coverLetter && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-medium">Cover Letter:</p>
                      <p className="text-gray-700 text-sm mt-1">{application.coverLetter}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Button variant="outline" size="small">
                    View Details
                  </Button>
                  <div className="flex space-x-1">
                    <Button variant="success" size="small">
                      Accept
                    </Button>
                    <Button variant="danger" size="small">
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// My Applications Tab for Job Seekers
const MyApplicationsTab = ({ applications }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">My Job Applications</h2>
      
      {applications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">You haven't applied to any jobs yet.</p>
          <Button variant="primary">
            Browse Jobs
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(application => (
            <div key={application._id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{application.job?.title}</h3>
                  <p className="text-gray-600">{application.job?.company} • {application.job?.location}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {application.status?.charAt(0).toUpperCase() + application.status?.slice(1) || 'Pending'}
                    </span>
                    <span className="text-gray-500 text-sm">
                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {application.coverLetter && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 font-medium">Your Cover Letter:</p>
                      <p className="text-gray-700 text-sm mt-1">{application.coverLetter}</p>
                    </div>
                  )}
                </div>
                <Button variant="outline" size="small">
                  View Job
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;