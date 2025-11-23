import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-white">YouthJobs</span>
            </div>
            <p className="mt-4 text-gray-300 max-w-md">
              Connecting talented youth with amazing career opportunities. 
              Our platform helps job seekers find their dream jobs and employers 
              discover exceptional talent.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              For Job Seekers
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/jobs" className="text-base text-gray-300 hover:text-white">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-base text-gray-300 hover:text-white">
                  Create Profile
                </Link>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Career Resources
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
              For Employers
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link to="/register" className="text-base text-gray-300 hover:text-white">
                  Post Jobs
                </Link>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Browse Candidates
                </a>
              </li>
              <li>
                <a href="#" className="text-base text-gray-300 hover:text-white">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-300 text-sm">
            &copy; 2025 Youth Employment Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6">
            <a href="#" className="text-gray-300 hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              Terms of Service
            </a>
            <a href="#" className="text-gray-300 hover:text-white">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;