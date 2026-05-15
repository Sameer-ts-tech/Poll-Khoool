import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Copy, CheckCircle2, Play, Trophy, ArrowRight } from 'lucide-react';
import API_BASE_URL from '../config';
import kbcSound from '../assets/kbc.mp3';

const Countdown = ({ targetDate, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    let interval;
    const update = () => {
      if (!targetDate) return;
      const diff = new Date(targetDate) - new Date();
      if (diff <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
        if (onExpire) onExpire();
      } else {
        setTimeLeft(Math.ceil(diff / 1000));
      }
    };
    update();
    interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onExpire]);

  return <span className="font-mono text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{timeLeft}s</span>;
};

const HostQuiz = () => {
  const { identifier } = useParams();
  const [poll, setPoll] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [isQuestionActive, setIsQuestionActive] = useState(false);
  const [endTime, setEndTime] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchAnalytics = useCallback(async (pollId) => {
    try {
      const res = await axios.get(`/api/polls/${pollId}/analytics`);
      setAnalytics(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (pollId) => {
    try {
      const res = await axios.get(`/api/polls/${pollId}/leaderboard`);
      setLeaderboard(res.data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let socket;
    let isMounted = true;

    const fetchPoll = async () => {
      try {
        const res = await axios.get(`/api/polls/${identifier}`);
        if (!isMounted) return;
        setPoll(res.data);
        setCurrentQuestionIndex(res.data.currentQuestionIndex);
        
        if (res.data.currentQuestionIndex >= 0) {
           fetchAnalytics(res.data._id);
           fetchLeaderboard(res.data._id);
        }

        socket = io(API_BASE_URL);
        socket.emit('join_poll', { pollId: res.data._id, visitorId: 'host' });
        
        socket.on('active_users_count', (count) => {
          if (isMounted) setActiveUsers(count);
        });

        socket.on('new_quiz_response', () => {
          fetchAnalytics(res.data._id);
        });

      } catch (err) {
        if (isMounted) setError('Failed to load quiz');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPoll();
    return () => {
      isMounted = false;
      if (socket) socket.disconnect();
    };
  }, [identifier, fetchAnalytics, fetchLeaderboard]);

  const publishQuestion = async (index) => {
    try {
      if (index === 0) {
        const audio = new Audio(kbcSound);
        audio.play().catch(e => console.error("Audio playback blocked:", e));
      }
      const res = await axios.put(`/api/polls/${poll._id}/publish-question`, { questionIndex: index });
      setCurrentQuestionIndex(index);
      setEndTime(res.data.endTime);
      setIsQuestionActive(true);
    } catch (e) {
      alert('Failed to publish question');
    }
  };

  const handleTimerExpire = useCallback(() => {
    setIsQuestionActive(false);
    fetchLeaderboard(poll._id);
  }, [fetchLeaderboard, poll]);

  const copyLink = () => {
    const link = `${window.location.origin}/p/${poll.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-center py-12 text-gray-400 animate-pulse">Loading dashboard...</div>;
  if (error) return <div className="text-center py-12 text-red-500">{error}</div>;

  const currentQ = currentQuestionIndex >= 0 ? poll.questions[currentQuestionIndex] : null;

  let chartData = [];
  if (currentQ) {
    chartData = currentQ.options.map((opt, i) => {
      let count = 0;
      if (analytics && analytics.results) {
        const match = analytics.results.find(r => r._id.questionId === currentQ._id && r._id.optionId === opt._id);
        if (match) count = match.count;
      }
      return {
        name: `Option ${i + 1}`,
        fullName: opt.text,
        count,
        isCorrect: currentQ.correctOptionIndex === i
      };
    });
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in relative z-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-dark-800/40 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{poll.title} <span className="text-primary text-lg ml-2 border border-primary/30 bg-primary/10 px-3 py-1 rounded-full uppercase tracking-wider">Host</span></h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Join Code: <strong className="text-white text-xl tracking-widest">{poll.shortCode}</strong></span>
            <button onClick={copyLink} className="text-primary hover:text-white transition-colors">
              {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-dark-900 px-6 py-3 rounded-xl border border-white/10">
          <Users className="w-5 h-5 text-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold text-xl">{activeUsers}</span>
          <span className="text-gray-400 text-sm">in lobby</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {currentQuestionIndex === -1 ? (
            <div className="card p-12 text-center flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6 border border-primary/30">
                <Play className="w-10 h-10 text-primary ml-2" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
              <p className="text-gray-400 text-lg mb-8">Wait for everyone to join, then publish the first question.</p>
              <button 
                onClick={() => publishQuestion(0)}
                className="btn-primary px-8 py-4 text-xl flex items-center shadow-[0_0_40px_rgba(139,92,246,0.4)]"
              >
                <ArrowRight className="w-6 h-6 mr-2" />
                Start Quiz
              </button>
            </div>
          ) : (
            <div className="card p-6 md:p-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <span className="text-primary font-bold text-lg bg-primary/10 px-4 py-1 rounded-full border border-primary/20">
                  Question {currentQuestionIndex + 1} of {poll.questions.length}
                </span>
                
                {isQuestionActive ? (
                  <div className="flex space-x-6 items-center">
                    <div className="text-right bg-dark-900/50 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Live Responses</p>
                      <p className="text-2xl font-bold text-primary">{chartData.reduce((acc, curr) => acc + curr.count, 0)}</p>
                    </div>
                    <div className="text-right bg-dark-900/50 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Time Remaining</p>
                      <Countdown targetDate={endTime} onExpire={handleTimerExpire} />
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-6 items-center">
                    <div className="text-right bg-dark-900/50 px-4 py-2 rounded-xl border border-white/10">
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">Total Responses</p>
                      <p className="text-2xl font-bold text-emerald-400">{chartData.reduce((acc, curr) => acc + curr.count, 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-red-400 font-bold text-2xl uppercase tracking-wider animate-pulse">Time's Up!</p>
                    </div>
                  </div>
                )}
              </div>

              <h2 className="text-3xl font-bold text-white mb-8">{currentQ.text}</h2>

              <div className="h-72 w-full mb-8 bg-dark-900/30 p-4 rounded-2xl border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" vertical={false} />
                    <XAxis dataKey="name" stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 12}} />
                    <YAxis allowDecimals={false} stroke="#94A3B8" tick={{fill: '#94A3B8', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#13131A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#8B5CF6' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      formatter={(value) => [`${value} votes`, 'Count']}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={500}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={!isQuestionActive && entry.isCorrect ? '#10B981' : '#8B5CF6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {!isQuestionActive && currentQuestionIndex < poll.questions.length - 1 && (
                <div className="flex justify-end pt-6 border-t border-white/10">
                  <button 
                    onClick={() => publishQuestion(currentQuestionIndex + 1)}
                    className="btn-primary px-6 py-3 flex items-center"
                  >
                    Next Question <ArrowRight className="w-5 h-5 ml-2" />
                  </button>
                </div>
              )}
              
              {!isQuestionActive && currentQuestionIndex === poll.questions.length - 1 && (
                <div className="flex justify-end pt-6 border-t border-white/10 text-emerald-400 font-bold text-2xl flex items-center">
                  <Trophy className="w-8 h-8 mr-3" /> Quiz Complete!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="card p-6 flex flex-col items-center justify-center text-center">
            <div className="bg-white p-2 rounded-xl mb-4">
              <QRCodeSVG value={`${window.location.origin}/p/${poll.shortCode}`} size={160} />
            </div>
            <p className="text-gray-400 text-sm">Scan to join on mobile</p>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-6 border-b border-white/10 pb-4">
              <Trophy className="w-6 h-6 text-amber-400 mr-3" />
              <h3 className="text-xl font-bold text-white">Live Leaderboard</h3>
            </div>
            
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No scores yet.</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((user, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-dark-900/50 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center space-x-3">
                      <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-amber-400 text-lg' : idx === 1 ? 'text-gray-300 text-lg' : idx === 2 ? 'text-amber-600 text-lg' : 'text-gray-500'}`}>
                        #{idx + 1}
                      </span>
                      <span className="text-white font-medium truncate max-w-[120px]">{user.participantName}</span>
                    </div>
                    <span className="text-primary font-bold">{user.totalScore} pt</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostQuiz;
