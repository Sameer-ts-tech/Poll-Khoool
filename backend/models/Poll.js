import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  }
});

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  isMandatory: {
    type: Boolean,
    default: true,
  },
  options: [optionSchema],
  timeLimit: {
    type: Number,
    default: 30,
  },
  correctOptionIndex: {
    type: Number,
  }
});

const pollSchema = new mongoose.Schema({
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
  },
  isQuiz: {
    type: Boolean,
    default: false,
  },
  currentQuestionIndex: {
    type: Number,
    default: -1,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished'],
    default: 'waiting',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  settings: {
    requiresAuth: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    }
  },
  questions: [questionSchema]
}, {
  timestamps: true,
});

const Poll = mongoose.model('Poll', pollSchema);
export default Poll;
