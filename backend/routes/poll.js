import express from 'express';
import { nanoid } from 'nanoid';
import Poll from '../models/Poll.js';
import Response from '../models/Response.js';
import QuizScore from '../models/QuizScore.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

router.post('/', protect, async (req, res) => {
  try {
    const { title, description, settings, questions, isQuiz } = req.body;

    const shortCode = nanoid(6);

    const poll = await Poll.create({
      creatorId: req.user._id,
      shortCode,
      title,
      description,
      settings,
      questions,
      isQuiz: isQuiz || false,
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error creating poll' });
  }
});

router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    const isObjectId = mongoose.Types.ObjectId.isValid(identifier);
    const query = isObjectId ? { _id: identifier } : { shortCode: identifier };

    const poll = await Poll.findOne(query).select('-creatorId');

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    res.status(200).json(poll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching poll' });
  }
});

router.post('/:id/response', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;

    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    if (new Date() > new Date(poll.settings.expiresAt)) {
      return res.status(400).json({ message: 'Poll has expired' });
    }
    if (poll.settings.requiresAuth && !req.user) {
      return res.status(401).json({ message: 'You must be logged in to take this poll' });
    }

    let existingResponse;
    if (req.user) {
      existingResponse = await Response.findOne({ pollId: poll._id, userId: req.user._id });
    } else {
      existingResponse = await Response.findOne({ pollId: poll._id, ipAddress: req.ip });
    }

    if (existingResponse) {
      return res.status(400).json({ message: 'You have already submitted a response to this poll' });
    }

    const response = await Response.create({
      pollId: poll._id,
      userId: req.user ? req.user._id : null,
      ipAddress: req.ip,
      answers,
    });

    const io = req.app.get('io');
    io.to(`poll_${poll._id}_active`).emit('new_response', response);

    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error submitting response' });
  }
});

router.get('/creator/me', protect, async (req, res) => {
  try {
    const polls = await Poll.find({ creatorId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(polls);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching your polls' });
  }
});

router.get('/:id/analytics', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const isCreator = req.user && poll.creatorId.toString() === req.user._id.toString();
    const isExpired = new Date() > new Date(poll.settings.expiresAt);

    if (!isCreator) {
      if (!poll.settings.isPublished) {
        return res.status(403).json({ message: 'Results are kept private by the creator.' });
      }
      if (!isExpired) {
        return res.status(403).json({ message: 'Results will be published here once the poll expires.' });
      }
    }

    let aggregatedResults = [];
    let totalResponses = 0;

    if (poll.isQuiz) {
      totalResponses = await QuizScore.countDocuments({ pollId: poll._id });
      aggregatedResults = await QuizScore.aggregate([
        { $match: { pollId: poll._id } },
        { $unwind: "$responses" },
        {
          $group: {
            _id: {
              questionId: "$responses.questionId",
              optionId: "$responses.optionId"
            },
            count: { $sum: 1 }
          }
        }
      ]);
    } else {
      totalResponses = await Response.countDocuments({ pollId: poll._id });
      aggregatedResults = await Response.aggregate([
        { $match: { pollId: poll._id } },
        { $unwind: "$answers" },
        {
          $group: {
            _id: {
              questionId: "$answers.questionId",
              optionId: "$answers.optionId"
            },
            count: { $sum: 1 }
          }
        }
      ]);
    }

    res.status(200).json({
      totalResponses,
      results: aggregatedResults
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching analytics' });
  }
});

router.put('/:id/publish-question', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { questionIndex } = req.body;

    const poll = await Poll.findById(id);

    if (!poll) return res.status(404).json({ message: 'Poll not found' });
    if (poll.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!poll.isQuiz) {
      return res.status(400).json({ message: 'This is not a quiz' });
    }

    poll.currentQuestionIndex = questionIndex;
    poll.status = 'active';
    await poll.save();

    const question = poll.questions[questionIndex];
    
    const io = req.app.get('io');
    const endTime = Date.now() + (question.timeLimit * 1000);
    
    io.to(`poll_${poll._id}_active`).emit('question_published', {
      questionIndex,
      question,
      endTime
    });

    res.status(200).json({ message: 'Question published', currentQuestionIndex: questionIndex, endTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error publishing question' });
  }
});

router.post('/:id/quiz-response', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { questionId, optionId, timeTaken, participantId, participantName } = req.body;

    const poll = await Poll.findById(id);
    if (!poll || !poll.isQuiz) return res.status(404).json({ message: 'Quiz not found' });

    const question = poll.questions.id(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    const timeLimitMs = question.timeLimit * 1000;
    if (timeTaken > timeLimitMs + 2000) { 
      return res.status(400).json({ message: 'Time limit exceeded' });
    }

    let pointsEarned = 0;
    const isCorrect = question.correctOptionIndex !== undefined && 
                      question.options[question.correctOptionIndex]._id.toString() === optionId;
                      
    if (isCorrect) {
      const timeRatio = Math.max(0, (timeLimitMs - timeTaken) / timeLimitMs);
      pointsEarned = Math.round(500 + (500 * timeRatio)); 
    }

    const pid = req.user ? req.user._id.toString() : participantId;
    
    const QuizScore = mongoose.model('QuizScore');
    let quizScore = await QuizScore.findOne({ pollId: poll._id, participantId: pid });

    if (!quizScore) {
      quizScore = new QuizScore({
        pollId: poll._id,
        participantId: pid,
        participantName: req.user ? req.user.name : (participantName || 'Anonymous'),
        responses: [],
        totalScore: 0
      });
    }

    if (quizScore.responses.some(r => r.questionId.toString() === questionId.toString())) {
      return res.status(400).json({ message: 'Already answered this question' });
    }

    quizScore.responses.push({
      questionId,
      optionId,
      timeTaken,
      pointsEarned
    });
    
    quizScore.totalScore += pointsEarned;
    await quizScore.save();

    const io = req.app.get('io');
    io.to(`poll_${poll._id}_active`).emit('new_quiz_response', { questionId, optionId });

    res.status(200).json({ isCorrect, pointsEarned, totalScore: quizScore.totalScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error submitting answer' });
  }
});

router.get('/:id/leaderboard', async (req, res) => {
  try {
    const QuizScore = mongoose.model('QuizScore');
    const scores = await QuizScore.find({ pollId: req.params.id })
      .sort({ totalScore: -1 })
      .limit(10)
      .select('participantName totalScore');
      
    res.status(200).json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

export default router;
