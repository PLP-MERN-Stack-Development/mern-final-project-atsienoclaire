import express from 'express';
import Job from '../models/Job.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get job seeker's applications
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker)
router.get('/my-applications', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const jobsWithApplications = await Job.find({
      'applications.jobSeeker': req.user.id
    })
      .populate('employer', 'name company')
      .select('title company location jobType category applications')
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
            jobType: job.jobType,
            category: job.category
          },
          status: app.status,
          appliedAt: app.appliedAt,
          coverLetter: app.coverLetter,
          resume: app.resume
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

// @desc    Withdraw application
// @route   DELETE /api/applications/:applicationId
// @access  Private (Job Seeker)
router.delete('/:applicationId', protect, authorize('jobseeker'), async (req, res) => {
  try {
    const job = await Job.findOne({
      'applications._id': req.params.applicationId,
      'applications.jobSeeker': req.user.id
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    job.applications.pull({ _id: req.params.applicationId });
    await job.save();

    res.json({
      success: true,
      message: 'Application withdrawn successfully'
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while withdrawing application'
    });
  }
});

export default router;