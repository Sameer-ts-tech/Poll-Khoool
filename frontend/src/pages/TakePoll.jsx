import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Users, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import API_BASE_URL from '../config';
import PlayQuiz from './PlayQuiz';

const Countdown = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  return <span>{timeLeft || 'calculating...'}</span>;
};

const TakePoll = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState(null);
  const [answers, setAnswers] = useState({});
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [socketInstance, setSocketInstance] = useState(null);

  useEffect(() => {
    let socket;
    let isMounted = true;

    const fetchPoll = async () => {
      try {
        const res = await axios.get(`/api/polls/${identifier}`);
        if (!isMounted) return;
        
        setPoll(res.data);
        
        socket = io(API_BASE_URL); 
        if (isMounted) setSocketInstance(socket);
        
        let visitorId = localStorage.getItem('visitorId');
        if (!visitorId) {
          visitorId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('visitorId', visitorId);
        }
        
        socket.emit('join_poll', { pollId: res.data._id, visitorId });
        
        socket.on('active_users_count', (count) => {
          if (isMounted) setActiveUsers(count);
        });

      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Poll not found');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPoll();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [identifier]);

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers({
      ...answers,
      [questionId]: optionId
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    for (let q of poll.questions) {
      if (q.isMandatory && !answers[q._id]) {
        return setError(`Please answer question: "${q.text}"`);
      }
    }

    setSubmitting(true);
    setError('');
    
    try {
      const formattedAnswers = Object.keys(answers).map(qId => ({
        questionId: qId,
        optionId: answers[qId]
      }));

      await axios.post(`/api/polls/${poll._id}/response`, { answers: formattedAnswers });
      navigate(`/r/${poll.shortCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-400 animate-pulse">Loading poll...</div>;
  
  if (error && !poll) return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center">
      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Error</h2>
      <p>{error}</p>
    </div>
  );

  if (poll && poll.isQuiz) {
    return <PlayQuiz poll={poll} socket={socketInstance} activeUsers={activeUsers} />;
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in relative z-10">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      {/* Header */}
      <div className="mb-8 card p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-3xl font-extrabold text-white">{poll.title}</h1>
          <div className="flex flex-col items-start md:items-end space-y-2">
            <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-full text-sm font-medium">
              <Users className="w-4 h-4 animate-pulse" />
              <span>{activeUsers} active now</span>
            </div>
            <div className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-full text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>Expires in <Countdown targetDate={poll.settings.expiresAt} onExpire={() => setError('This poll has expired.')} /></span>
            </div>
          </div>
        </div>
        {poll.description && (
          <p className="text-gray-400 text-lg leading-relaxed">{poll.description}</p>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {poll.settings.requiresAuth && !user && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
          <strong className="text-amber-300">Authentication Required:</strong> You must be logged in to participate in this poll.
        </div>
      )}

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {poll.questions.map((q, index) => (
          <div key={q._id} className="card p-6 md:p-8">
            <h3 className="text-xl font-semibold text-white mb-6">
              <span className="text-primary mr-2">{index + 1}.</span> {q.text} {q.isMandatory && <span className="text-red-500 ml-1">*</span>}
            </h3>
            <div className="space-y-3">
              {q.options.map((opt) => (
                <label 
                  key={opt._id} 
                  className={`flex items-center p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                    answers[q._id] === opt._id 
                      ? 'border-2 border-primary bg-primary/10 shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                      : 'border-2 border-white/5 bg-dark-900/50 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name={q._id}
                    className="w-5 h-5 text-primary bg-dark-800 border-white/20 focus:ring-primary focus:ring-offset-dark-900"
                    checked={answers[q._id] === opt._id}
                    onChange={() => handleOptionSelect(q._id, opt._id)}
                  />
                  <span className={`ml-4 font-medium text-lg ${answers[q._id] === opt._id ? 'text-white' : 'text-gray-400'}`}>{opt.text}</span>
                  {answers[q._id] === opt._id && (
                    <CheckCircle2 className="w-6 h-6 text-primary ml-auto drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-6">
          <button 
            type="submit" 
            disabled={submitting || (poll.settings.requiresAuth && !user)}
            className={`btn-primary w-full py-4 text-lg ${(submitting || (poll.settings.requiresAuth && !user)) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TakePoll;
