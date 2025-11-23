import express from 'express';
import mongoose from 'mongoose';
import Job from '../models/Job.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Debug job creation - Check what data is being sent
// @route   POST /api/jobs/debug-create
// @access  Private (Employer/Admin)
router.post('/debug-create', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    console.log('🧪 DEBUG JOB CREATION DATA:');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('User:', req.user.id);
    
    // Test validation with the Job model
    const testJob = new Job({
      ...req.body,
      employer: req.user.id
    });
    
    // Try to validate
    await testJob.validate();
    console.log('✅ Validation passed');
    
    res.json({
      success: true,
      message: 'Validation passed',
      data: req.body
    });
    
  } catch (error) {
    console.error('🔴 DEBUG VALIDATION FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', errors);
      
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer/Admin)
router.post('/', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    console.log('🟡 [CREATE JOB] Starting job creation...');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User ID:', req.user.id);

    // Add employer to req.body
    req.body.employer = req.user.id;

    // Ensure all required fields are present with defaults if needed
    const jobData = {
      ...req.body,
      // Ensure optional fields have defaults
      responsibilities: req.body.responsibilities || 'Not specified',
      experienceLevel: req.body.experienceLevel || 'Entry',
      skills: req.body.skills || [],
      benefits: req.body.benefits || [],
      isActive: true
    };

    console.log('🔍 Final job data before creation:', jobData);

    const job = await Job.create(jobData);

    console.log('✅ Job created successfully:', job._id);

    // Populate employer details
    await job.populate('employer', 'name company');

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('🔴 [CREATE JOB] ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.error('📋 VALIDATION ERRORS:');
      const errors = Object.values(error.errors).map(val => {
        console.error(`- ${val.path}: ${val.message} (value: ${val.value})`);
        return val.message;
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errors
      });
    }
    
    console.error('Full error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Server error while creating job'
    });
  }
});

// @desc    Test route - Check if everything works
// @route   GET /api/jobs/debug-test
// @access  Private (Employer)
router.get('/debug-test', protect, authorize('employer'), async (req, res) => {
  try {
    console.log('🧪 DEBUG TEST ROUTE STARTED');
    
    // Test 1: Check if user is properly authenticated
    console.log('✅ User authenticated:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });

    // Test 2: Check database connection by counting jobs
    const jobCount = await Job.countDocuments({ employer: req.user.id });
    console.log('✅ Database connection working. Job count:', jobCount);

    // Test 3: Try a simple query without populate
    const simpleJobs = await Job.find({ employer: req.user.id })
      .select('title company salary')
      .limit(1)
      .sort({ createdAt: -1 });
    
    console.log('✅ Simple query working. Sample job:', simpleJobs[0]);

    // Test 4: Try with populate to see if that's the issue
    if (simpleJobs.length > 0) {
      const populatedJob = await Job.findById(simpleJobs[0]._id)
        .populate('applications.jobSeeker', 'name email');
      console.log('✅ Populate working:', !!populatedJob);
    }

    res.json({
      success: true,
      message: 'All tests passed',
      user: {
        id: req.user.id,
        role: req.user.role
      },
      jobCount,
      sampleJob: simpleJobs[0] || null
    });

  } catch (error) {
    console.error('🔴 DEBUG TEST FAILED:');
    console.error('Error at step:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Debug test failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// @desc    Test apply route - Check apply functionality
// @route   POST /api/jobs/test-apply/:id
// @access  Private (Job Seeker)
router.post('/test-apply/:id', protect, authorize('jobseeker'), async (req, res) => {
  try {
    console.log('🧪 TEST APPLY ROUTE STARTED');
    
    // Test 1: Check authentication
    console.log('✅ User authenticated:', {
      id: req.user.id,
      role: req.user.role,
      email: req.user.email
    });

    // Test 2: Check job exists
    const job = await Job.findById(req.params.id).select('title company isActive');
    console.log('✅ Job found:', job ? {
      title: job.title,
      company: job.company,
      isActive: job.isActive
    } : 'No');

    if (!job) {
      return res.json({
        success: false,
        message: 'Job not found in test',
        test: 'FAILED - Job not found'
      });
    }

    // Test 3: Check if user already applied
    const applicationsCount = await Job.countDocuments({
      _id: req.params.id,
      'applications.jobSeeker': req.user.id
    });
    
    console.log('✅ Already applied:', applicationsCount > 0 ? 'Yes' : 'No');

    // Test 4: Check request body
    console.log('✅ Request body:', {
      coverLetter: req.body.coverLetter ? 'Provided' : 'Missing',
      resume: req.body.resume ? 'Provided' : 'Missing'
    });

    res.json({
      success: true,
      message: 'Apply test passed',
      tests: {
        authentication: 'PASSED',
        jobExists: 'PASSED',
        jobActive: job.isActive ? 'PASSED' : 'FAILED - Job inactive',
        alreadyApplied: applicationsCount > 0 ? 'FAILED - Already applied' : 'PASSED',
        coverLetter: req.body.coverLetter ? 'PASSED' : 'FAILED - Missing cover letter'
      },
      job: {
        title: job.title,
        company: job.company,
        isActive: job.isActive
      },
      user: {
        id: req.user.id,
        hasApplied: applicationsCount > 0
      }
    });

  } catch (error) {
    console.error('🔴 TEST APPLY FAILED:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Apply test failed',
      error: error.message,
      test: 'FAILED'
    });
  }
});

// @desc    Get employer's jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Employer)
router.get('/my-jobs', protect, authorize('employer'), async (req, res) => {
  try {
    console.log('🟡 [MY-JOBS] Route started');
    console.log('🔐 User ID:', req.user.id);
    console.log('👤 User role:', req.user.role);
    
    // Check if user ID is valid
    if (!req.user.id || !mongoose.Types.ObjectId.isValid(req.user.id)) {
      console.log('❌ Invalid user ID:', req.user.id);
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }

    console.log('🔍 Querying database for jobs...');
    
    // First try without populate to isolate the issue
    const jobsWithoutPopulate = await Job.find({ employer: req.user.id })
      .sort({ createdAt: -1 });

    console.log('✅ Basic query successful. Jobs found:', jobsWithoutPopulate.length);
    
    // Now try with populate
    const jobs = await Job.find({ employer: req.user.id })
      .populate({
        path: 'applications.jobSeeker',
        select: 'name email profile',
        options: { retainNullValues: true }
      })
      .sort({ createdAt: -1 });

    console.log('✅ Populate query successful');
    
    // Log sample job data to check structure
    if (jobs.length > 0) {
      console.log('📝 Sample job details:', {
        id: jobs[0]._id,
        title: jobs[0].title,
        salary: jobs[0].salary,
        salaryType: typeof jobs[0].salary,
        applications: jobs[0].applications?.length,
        firstApplication: jobs[0].applications?.[0] ? {
          hasJobSeeker: !!jobs[0].applications[0].jobSeeker,
          jobSeekerType: typeof jobs[0].applications[0].jobSeeker
        } : 'No applications'
      });
    }
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
    
  } catch (error) {
    console.error('🔴 [MY-JOBS] CRITICAL ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      console.error('🗄️ MongoDB Error Details:');
      console.error('Error code:', error.code);
    }
    
    if (error.name === 'ValidationError') {
      console.error('📋 Validation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}:`, error.errors[key].message);
      });
    }
    
    if (error.message.includes('populate') || error.message.includes('Cast to ObjectId failed')) {
      console.error('🔗 Population error detected - trying fallback query...');
      try {
        const fallbackJobs = await Job.find({ employer: req.user.id })
          .select('-applications')
          .sort({ createdAt: -1 });
        
        console.log('🔄 Fallback query successful, jobs:', fallbackJobs.length);
        
        return res.json({
          success: true,
          count: fallbackJobs.length,
          data: fallbackJobs,
          note: 'Applications not loaded due to data inconsistency'
        });
      } catch (fallbackError) {
        console.error('🔴 Fallback also failed:', fallbackError.message);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error while fetching your jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack
      })
    });
  }
});

// @desc    Apply for job
// @route   POST /api/jobs/:id/apply
// @access  Private (Job Seeker)
router.post('/:id/apply', protect, authorize('jobseeker'), async (req, res) => {
  try {
    console.log('🟡 [APPLY] Starting job application process');
    console.log('👤 User ID:', req.user.id);
    console.log('🎯 Job ID:', req.params.id);
    console.log('📝 Application data:', {
      resume: req.body.resume ? 'Provided' : 'Not provided',
      coverLetter: req.body.coverLetter ? 'Provided' : 'Not provided'
    });

    // Validate job ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('❌ Invalid job ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    // Find the job
    const job = await Job.findById(req.params.id);
    console.log('🔍 Job found:', job ? 'Yes' : 'No');

    if (!job) {
      console.log('❌ Job not found with ID:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is active
    if (!job.isActive) {
      console.log('❌ Job is not active');
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Check if already applied
    const alreadyApplied = job.applications.find(
      application => application.jobSeeker && application.jobSeeker.toString() === req.user.id
    );

    console.log('📋 Already applied:', alreadyApplied ? 'Yes' : 'No');

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'Already applied for this job'
      });
    }

    // Validate application data
    if (!req.body.coverLetter || req.body.coverLetter.trim().length === 0) {
      console.log('❌ Cover letter is required');
      return res.status(400).json({
        success: false,
        message: 'Cover letter is required'
      });
    }

    // Create application object
    const applicationData = {
      jobSeeker: req.user.id,
      coverLetter: req.body.coverLetter.trim(),
      status: 'pending'
    };

    // Add resume if provided
    if (req.body.resume && req.body.resume.trim().length > 0) {
      applicationData.resume = req.body.resume.trim();
    }

    console.log('📄 Final application data:', applicationData);

    // Add application to job
    job.applications.push(applicationData);

    // Save the job with the new application
    console.log('💾 Saving job with new application...');
    await job.save();
    console.log('✅ Job saved successfully');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: job.applications[job.applications.length - 1]._id,
        jobTitle: job.title,
        company: job.company,
        appliedAt: new Date()
      }
    });

  } catch (error) {
    console.error('🔴 [APPLY] CRITICAL ERROR:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Handle specific error types
    if (error.name === 'ValidationError') {
      console.error('📋 Validation Errors:');
      Object.keys(error.errors).forEach(key => {
        console.error(`- ${key}:`, error.errors[key].message);
      });
      
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    if (error.name === 'CastError') {
      console.error('🎯 Cast Error - Invalid ID format');
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
      console.error('🔑 Duplicate application detected');
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while applying for job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// @desc    Get all jobs with filtering and pagination
// @route   GET /api/jobs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      location,
      jobType,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build query object
    let query = { isActive: true };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    // Filter by job type
    if (jobType && jobType !== 'All') {
      query.jobType = jobType;
    }

    // Search in title, description, or company
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('employer', 'name company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit)
      },
      data: jobs
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching jobs'
    });
  }
});

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name email profile company')
      .populate('applications.jobSeeker', 'name email profile');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job'
    });
  }
});

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer/Admin)
router.put('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job'
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('employer', 'name company');

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating job'
    });
  }
});

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Admin)
router.delete('/:id', protect, authorize('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Make sure user is job owner or admin
    if (job.employer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job'
      });
    }

    await Job.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting job'
    });
  }
});

// @desc    Get jobs for job seeker (all active jobs)
// @route   GET /api/jobs/available
// @access  Private (Job Seeker)
router.get('/available', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const {
      category,
      location,
      jobType,
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build query object - only active jobs
    let query = { isActive: true };

    // Filter by category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by location
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    // Filter by job type
    if (jobType && jobType !== 'All') {
      query.jobType = jobType;
    }

    // Search in title, description, or company
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    // Execute query with pagination
    const jobs = await Job.find(query)
      .populate('employer', 'name company')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      count: jobs.length,
      total,
      pagination: {
        page: Number(page),
        pages: Math.ceil(total / limit)
      },
      data: jobs
    });
  } catch (error) {
    console.error('Get available jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available jobs'
    });
  }
});

// @desc    Get job seeker's applications
// @route   GET /api/jobs/my-applications
// @access  Private (Job Seeker)
router.get('/my-applications', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const jobsWithApplications = await Job.find({
      'applications.jobSeeker': req.user.id
    })
      .populate('employer', 'name company')
      .select('title company location jobType applications')
      .sort({ createdAt: -1 });

    // Extract applications for the current user
    const userApplications = jobsWithApplications.flatMap(job => 
      job.applications
        .filter(app => app.jobSeeker.toString() === req.user.id)
        .map(app => ({
          _id: app._id,
          job: {
            _id: job._id,
            title: job.title,
            company: job.company,
            location: job.location,
            jobType: job.jobType
          },
          status: app.status,
          appliedAt: app.appliedAt,
          coverLetter: app.coverLetter
        }))
    );

    res.json({
      success: true,
      count: userApplications.length,
      data: userApplications
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching applications'
    });
  }
});

// @desc    Get applications for a specific job (Employer only)
// @route   GET /api/jobs/:id/applications
// @access  Private (Employer)
router.get('/:id/applications', protect, authorize('employer'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('applications.jobSeeker', 'name email profile');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if employer owns this job
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job'
      });
    }

    res.json({
      success: true,
      data: job.applications
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching job applications'
    });
  }
});

// @desc    Update application status (Employer only)
// @route   PUT /api/jobs/:jobId/applications/:applicationId
// @access  Private (Employer)
router.put('/:jobId/applications/:applicationId', protect, authorize('employer'), async (req, res) => {
  try {
    const { status } = req.body;
    const { jobId, applicationId } = req.params;

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if employer owns this job
    if (job.employer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update applications for this job'
      });
    }

    // Find and update the application
    const application = job.applications.id(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    application.status = status;
    await job.save();

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: application
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating application status'
    });
  }
});

export default router;