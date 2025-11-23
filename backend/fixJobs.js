import mongoose from 'mongoose';
import Job from './models/Job.js';
import dotenv from 'dotenv';

dotenv.config();

const fixExistingJobs = async () => {
  try {
    console.log('🔧 Starting job data fix...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/youth-employment');
    console.log('✅ Connected to database');

    // Find all jobs
    const jobs = await Job.find({});
    console.log(`📊 Found ${jobs.length} jobs to check`);

    let updatedCount = 0;
    
    for (const job of jobs) {
      // Check if salary is an object (old format)
      if (job.salary && typeof job.salary === 'object' && job.salary !== null) {
        console.log(`🔄 Found job with object salary:`, job.salary);
        
        // Convert to number - use min, max, or average
        let newSalary = 0;
        
        if (job.salary.min !== undefined && job.salary.max !== undefined) {
          newSalary = Math.round((job.salary.min + job.salary.max) / 2);
        } else if (job.salary.min !== undefined) {
          newSalary = job.salary.min;
        } else if (job.salary.max !== undefined) {
          newSalary = job.salary.max;
        }
        
        console.log(`💰 Converting salary from object to number: ${newSalary}`);
        
        // Update the job
        await Job.findByIdAndUpdate(job._id, { salary: newSalary });
        updatedCount++;
        
        console.log(`✅ Updated job: ${job.title} - New salary: $${newSalary}`);
      }
    }

    console.log(`🎉 Fix completed! Updated ${updatedCount} jobs`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing jobs:', error);
    process.exit(1);
  }
};

// Run the fix
fixExistingJobs();