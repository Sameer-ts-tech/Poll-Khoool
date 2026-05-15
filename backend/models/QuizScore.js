import mongoose from 'mongoose';

const responseSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  optionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  timeTaken: {
    type: Number,
    required: true,
  },
  pointsEarned: {
    type: Number,
    required: true,
    default: 0,
  }
});

const quizScoreSchema = new mongoose.Schema({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true,
  },
  participantId: {
    type: String,
    required: true,
  },
  participantName: {
    type: String,
    required: true,
  },
  totalScore: {
    type: Number,
    default: 0,
  },
  responses: [responseSchema]
}, {
  timestamps: true,
});

quizScoreSchema.index({ pollId: 1, participantId: 1 }, { unique: true });

const QuizScore = mongoose.model('QuizScore', quizScoreSchema);
export default QuizScore;
