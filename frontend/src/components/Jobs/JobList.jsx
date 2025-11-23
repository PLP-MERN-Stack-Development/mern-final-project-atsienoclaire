import React from 'react';
import JobCard from './JobCard';
import LoadingSpinner from '../UI/LoadingSpinner';

const JobList = ({ jobs, loading, error }) => {
  // Safety check - ensure jobs is always an array
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="large" />
        <span className="ml-3 text-gray-600">Loading jobs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-2">Error loading jobs</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!safeJobs || safeJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-2">No jobs found</div>
        <p className="text-gray-400">Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-gray-600">
        Showing {safeJobs.length} job{safeJobs.length !== 1 ? 's' : ''}
      </div>
      {safeJobs.map((job) => (
        <JobCard key={job._id} job={job} />
      ))}
    </div>
  );
};

export default JobList;