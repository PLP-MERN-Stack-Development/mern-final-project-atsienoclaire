import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import JobList from '../components/Jobs/JobList';
import JobFilters from '../components/Jobs/JobFilters';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0
  });

  const fetchJobs = async (filters = {}, page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await api.get(`/jobs?${params}`);
      console.log('API Response:', response.data); // Debug log
      
      // Handle different response structures
      const responseData = response.data;
      
      // Check if data is in data property or directly in response
      const jobsData = responseData.data || responseData.jobs || [];
      const totalPages = responseData.pagination?.pages || responseData.totalPages || 1;
      const currentPage = responseData.pagination?.page || responseData.currentPage || page;
      const total = responseData.total || responseData.count || 0;

      setJobs(jobsData);
      setPagination({
        page: currentPage,
        totalPages,
        total
      });
      setError('');
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
      setJobs([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilter = (newFilters) => {
    setFilters(newFilters);
    fetchJobs(newFilters, 1);
  };

  const handlePageChange = (newPage) => {
    fetchJobs(filters, newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Jobs</h1>
          <p className="text-gray-600 mt-2">
            Find your next career opportunity from our curated list of jobs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <JobFilters onFilter={handleFilter} loading={loading} />
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            <JobList 
              jobs={jobs} 
              loading={loading} 
              error={error} 
            />
            
            {/* Pagination */}
            {!loading && jobs && jobs.length > 0 && (
              <div className="flex justify-center items-center space-x-2 mt-8">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;