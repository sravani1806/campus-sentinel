import mongoose from 'mongoose';

const StudentSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  roll_no: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: 'Computer Science & Engineering'
  },
  current_zone: {
    type: String,
    default: 'BLOCK_B_L1'
  },
  zone_name: {
    type: String,
    default: 'U Block'
  },
  status: {
    type: String,
    enum: ['SAFE', 'IN_DANGER', 'UNACCOUNTED'],
    default: 'UNACCOUNTED',
    index: true
  },
  last_checkin_time: {
    type: Date,
    default: Date.now
  },
  emergency_message: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: '+91 98765 43210'
  },
  blood_group: {
    type: String,
    default: 'O+'
  },
  assigned_exit: {
    type: String,
    default: 'EXIT_NORTH_GATE'
  },
  is_rescued: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export const StudentModel = mongoose.models.Student || mongoose.model('Student', StudentSchema);
