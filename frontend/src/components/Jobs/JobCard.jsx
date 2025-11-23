import React from 'react';
import { Link } from 'react-router-dom';

const JobCard = ({ job }) => {
  const formatSalary = (salary) => {
    if (!salary) return 'Negotiable';
    const { min, max, currency = 'USD' } = salary;
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    return 'Negotiable';
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            <Link 
              to={`/jobs/${job._id}`} 
              className="hover:text-blue-600 transition-colors"
            >
              {job.title}
            </Link>
          </h3>
          <p className="text-gray-700 font-medium">{job.company}</p>
          <p className="text-gray-500 text-sm mt-1">
            📍 {job.location}
          </p>
        </div>
        <div className="text-right ml-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {job.jobType}
          </span>
          {job.salary && (
            <p className="text-gray-900 font-semibold mt-2 text-lg">
              {formatSalary(job.salary)}
            </p>
          )}
        </div>
      </div>
      
      <p className="text-gray-600 line-clamp-2 mb-4">
        {job.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {job.category}
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            {job.applications?.length || 0} applications
          </span>
        </div>
        <Link
          to={`/jobs/${job._id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          View Details
        </Link>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          Posted {new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default JobCard;