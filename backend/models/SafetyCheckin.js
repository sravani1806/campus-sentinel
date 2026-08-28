import mongoose from 'mongoose';

const SafetyCheckinSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  student_id: {
    type: String,
    required: true,
    index: true
  },
  user_name: {
    type: String,
    required: true
  },
  zone_id: {
    type: String,
    required: true
  },
  zone_name: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['SAFE', 'IN_DANGER', 'SOS_NEED_HELP', 'UNACCOUNTED'],
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const SafetyCheckinModel = mongoose.models.SafetyCheckin || mongoose.model('SafetyCheckin', SafetyCheckinSchema);
