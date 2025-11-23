import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobSeeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  resume: String,
  coverLetter: String,
  appliedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'rejected', 'accepted'],
    default: 'pending'
  }
});

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  company: {
    type: String,
    required: [true, 'Please add a company name'],
    trim: true,
    maxlength: [100, 'Company name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a job description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  requirements: {
    type: String,
    required: [true, 'Please add job requirements'],
    maxlength: [1000, 'Requirements cannot be more than 1000 characters']
  },
  responsibilities: {
    type: String,
    maxlength: [1000, 'Responsibilities cannot be more than 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Technology', 'Business', 'Healthcare', 'Education', 'Arts', 'Other']
  },
  location: {
    type: String,
    required: [true, 'Please add a location'],
    trim: true,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  // HYBRID SALARY SOLUTION: Handles both number and object formats
  salary: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Please add salary information'],
    validate: {
      validator: function(value) {
        // Allow number format (new jobs)
        if (typeof value === 'number') {
          return value >= 0;
        }
        
        // Allow object format (existing jobs with min/max)
        if (typeof value === 'object' && value !== null) {
          const hasMin = value.min !== undefined && typeof value.min === 'number' && value.min >= 0;
          const hasMax = value.max !== undefined && typeof value.max === 'number' && value.max >= 0;
          return hasMin || hasMax;
        }
        
        return false;
      },
      message: 'Salary must be a positive number or an object with min/max numbers'
    }
  },
  jobType: {
    type: String,
    required: [true, 'Please select a job type'],
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote']
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [applicationSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  deadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  experienceLevel: {
    type: String,
    enum: ['Entry', 'Mid', 'Senior', 'Executive'],
    default: 'Entry'
  },
  skills: [{
    type: String,
    trim: true
  }],
  benefits: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
jobSchema.index({ employer: 1, createdAt: -1 });
jobSchema.index({ isActive: 1, createdAt: -1 });
jobSchema.index({ category: 1, isActive: 1 });
jobSchema.index({ location: 1, isActive: 1 });
jobSchema.index({ jobType: 1, isActive: 1 });

// Text search index
jobSchema.index({ 
  title: 'text', 
  description: 'text', 
  company: 'text',
  requirements: 'text'
});

// Virtual for formatted salary - Handles both number and object formats
jobSchema.virtual('formattedSalary').get(function() {
  if (!this.salary) return 'Salary not specified';
  
  // Handle number salary (new format)
  if (typeof this.salary === 'number') {
    return `$${this.salary.toLocaleString()}`;
  }
  
  // Handle object salary (existing data with min/max)
  if (typeof this.salary === 'object' && this.salary !== null) {
    const min = this.salary.min;
    const max = this.salary.max;
    const currency = this.salary.currency || 'USD';
    
    if (min !== undefined && max !== undefined) {
      return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    } else if (min !== undefined) {
      return `$${min.toLocaleString()}+`;
    } else if (max !== undefined) {
      return `Up to $${max.toLocaleString()}`;
    }
  }
  
  return 'Salary not specified';
});

// Virtual for getting average salary (useful for sorting)
jobSchema.virtual('averageSalary').get(function() {
  if (!this.salary) return 0;
  
  if (typeof this.salary === 'number') {
    return this.salary;
  }
  
  if (typeof this.salary === 'object' && this.salary !== null) {
    const { min, max } = this.salary;
    if (min !== undefined && max !== undefined) {
      return Math.round((min + max) / 2);
    } else if (min !== undefined) {
      return min;
    } else if (max !== undefined) {
      return max;
    }
  }
  
  return 0;
});

// Virtual for checking if job is expired
jobSchema.virtual('isExpired').get(function() {
  if (!this.deadline) return false;
  return this.deadline < new Date();
});

// Instance method to get application count
jobSchema.methods.getApplicationCount = function() {
  return this.applications.length;
};

// Instance method to check if user has applied
jobSchema.methods.hasUserApplied = function(userId) {
  return this.applications.some(app => 
    app.jobSeeker && app.jobSeeker.toString() === userId.toString()
  );
};

// Static method to get jobs by employer
jobSchema.statics.getJobsByEmployer = function(employerId) {
  return this.find({ employer: employerId })
    .populate('applications.jobSeeker', 'name email profile')
    .sort({ createdAt: -1 });
};

// Static method to get active jobs with filters - Updated for hybrid salary
jobSchema.statics.getActiveJobs = function(filters = {}) {
  const {
    category,
    location,
    jobType,
    search,
    minSalary,
    maxSalary,
    page = 1,
    limit = 10
  } = filters;

  let query = { isActive: true };

  // Apply filters
  if (category && category !== 'All') {
    query.category = category;
  }

  if (location) {
    query.location = new RegExp(location, 'i');
  }

  if (jobType && jobType !== 'All') {
    query.jobType = jobType;
  }

  // Enhanced salary filtering for hybrid format
  if (minSalary || maxSalary) {
    const salaryFilter = [];
    const min = minSalary ? parseInt(minSalary) : 0;
    const max = maxSalary ? parseInt(maxSalary) : Number.MAX_SAFE_INTEGER;

    // Filter for number salaries
    salaryFilter.push({
      salary: {
        $gte: min,
        $lte: max
      }
    });

    // Filter for object salaries with min field
    salaryFilter.push({
      $and: [
        { 'salary.min': { $exists: true } },
        { 'salary.min': { $gte: min } },
        { 'salary.min': { $lte: max } }
      ]
    });

    // Filter for object salaries with max field
    salaryFilter.push({
      $and: [
        { 'salary.max': { $exists: true } },
        { 'salary.max': { $gte: min } },
        { 'salary.max': { $lte: max } }
      ]
    });

    // Filter for object salaries with both min and max
    salaryFilter.push({
      $and: [
        { 'salary.min': { $exists: true } },
        { 'salary.max': { $exists: true } },
        { $or: [
          { 'salary.min': { $gte: min, $lte: max } },
          { 'salary.max': { $gte: min, $lte: max } },
          { $and: [
            { 'salary.min': { $lte: min } },
            { 'salary.max': { $gte: max } }
          ]}
        ]}
      ]
    });

    query.$or = salaryFilter;
  }

  // Text search
  if (search) {
    query.$text = { $search: search };
  }

  return this.find(query)
    .populate('employer', 'name company profile')
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });
};

// Middleware to automatically convert object salaries to numbers for new jobs
jobSchema.pre('save', function(next) {
  // Only convert object salaries for new job creations
  if (this.isNew && this.salary && typeof this.salary === 'object') {
    console.log('🔄 Converting object salary to number for new job...');
    
    const { min, max } = this.salary;
    
    if (min !== undefined && max !== undefined) {
      // Use average of min and max
      this.salary = Math.round((min + max) / 2);
    } else if (min !== undefined) {
      this.salary = min;
    } else if (max !== undefined) {
      this.salary = max;
    } else {
      this.salary = 0;
    }
    
    console.log(`✅ Converted salary to: $${this.salary}`);
  }
  
  // Validate deadline
  if (this.deadline && this.deadline < new Date()) {
    next(new Error('Job deadline cannot be in the past'));
  } else {
    next();
  }
});

// Static method to fix existing jobs with object salaries
jobSchema.statics.fixObjectSalaries = async function() {
  try {
    console.log('🔧 Fixing existing jobs with object salaries...');
    
    const jobs = await this.find({
      $or: [
        { salary: { $type: 'object' } },
        { 'salary.min': { $exists: true } },
        { 'salary.max': { $exists: true } }
      ]
    });
    
    console.log(`📊 Found ${jobs.length} jobs with object salaries`);
    
    let fixedCount = 0;
    
    for (const job of jobs) {
      if (job.salary && typeof job.salary === 'object') {
        const { min, max } = job.salary;
        let newSalary = 0;
        
        if (min !== undefined && max !== undefined) {
          newSalary = Math.round((min + max) / 2);
        } else if (min !== undefined) {
          newSalary = min;
        } else if (max !== undefined) {
          newSalary = max;
        }
        
        await this.findByIdAndUpdate(job._id, { salary: newSalary });
        fixedCount++;
        console.log(`✅ Fixed job ${job.title}: $${newSalary}`);
      }
    }
    
    console.log(`🎉 Fixed ${fixedCount} jobs successfully`);
    return fixedCount;
    
  } catch (error) {
    console.error('❌ Error fixing salaries:', error);
    throw error;
  }
};

// Ensure virtual fields are serialized
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

export default mongoose.model('Job', jobSchema);