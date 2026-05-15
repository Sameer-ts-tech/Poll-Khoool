import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Copy, Share2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API_BASE_URL from '../config';

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

const PollResults = () => {
  const { identifier } = useParams();
  const { user } = useAuth();
  
  const [poll, setPoll] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeUsers, setActiveUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isWaitingForExpiry, setIsWaitingForExpiry] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let socket;
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch poll details
        const pollRes = await axios.get(`/api/polls/${identifier}`);
        if (!isMounted) return;
        const pollData = pollRes.data;
        setPoll(pollData);

        // Fetch analytics
        const analyticsRes = await axios.get(`/api/polls/${pollData._id}/analytics`);
        if (!isMounted) return;
        setAnalytics(analyticsRes.data);
        setError('');
        setIsWaitingForExpiry(false);

        socket = io(API_BASE_URL);
        
        let visitorId = localStorage.getItem('visitorId');
        if (!visitorId) {
          visitorId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('visitorId', visitorId);
        }

        socket.emit('join_poll', { pollId: pollData._id, visitorId });
        
        socket.on('active_users_count', (count) => {
          if (isMounted) setActiveUsers(count);
        });
        
        socket.on('new_response', () => {
          axios.get(`/api/polls/${pollData._id}/analytics`)
            .then(res => {
              if (isMounted) {
                 setAnalytics(res.data);
                 setIsWaitingForExpiry(false);
                 setError('');
              }
            })
            .catch(err => console.error(err));
        });

      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 403 && err.response?.data?.message.includes('expires')) {
             setIsWaitingForExpiry(true);
             setError(err.response?.data?.message);
             
             let pollDataObj = poll;
             if (!pollDataObj) {
                try {
                  const pollRes = await axios.get(`/api/polls/${identifier}`);
                  pollDataObj = pollRes.data;
                  setPoll(pollDataObj);
                } catch (e) {}
             }
             
             if (pollDataObj) {
               // The Countdown component will handle the refresh, we don't need setTimeout here anymore
             }
          } else {
             setError(err.response?.data?.message || 'Cannot access results');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (socket) {
        socket.disconnect();
      }
    };
  }, [identifier]);

  const copyLink = () => {
    const link = `${window.location.origin}/p/${poll.shortCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="text-center py-12 text-gray-400 animate-pulse">Loading results...</div>;
  if (error && !isWaitingForExpiry) return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center">
      <AlertCircle className="w-12 h-12 mx-auto mb-4" />
      <p>{error}</p>
    </div>
  );

  if (isWaitingForExpiry && poll) {
    return (
      <div className="card max-w-xl mx-auto mt-12 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px]"></div>
        <div className="w-16 h-16 bg-dark-800 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
          <span className="text-2xl">⏳</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Results are Hidden</h2>
        <p className="text-gray-400 mb-6 text-lg">{error}</p>
        <div className="bg-dark-900/50 px-6 py-4 rounded-xl border border-white/10 inline-block">
          <p className="text-sm text-gray-500 uppercase font-semibold tracking-wider mb-1">Results published in</p>
          <p className="text-2xl font-bold text-primary animate-pulse">
            <Countdown targetDate={poll.settings.expiresAt} onExpire={() => window.location.reload()} />
          </p>
          <p className="text-sm text-gray-500 mt-2">({new Date(poll.settings.expiresAt).toLocaleString()})</p>
        </div>
      </div>
    );
  }

  const getOptionCount = (questionId, optionId) => {
    if (!analytics || !analytics.results) return 0;
    const match = analytics.results.find(
      r => r._id.questionId === questionId && r._id.optionId === optionId
    );
    return match ? match.count : 0;
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      
      {/* Header Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 relative z-10">
        <div className="lg:col-span-2 card bg-gradient-to-br from-dark-800 to-primary/20 border-white/10 p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-2 text-white">{poll.title}</h1>
          <p className="text-gray-300 mb-6">{poll.description}</p>
          
          <div className="flex flex-wrap gap-4 mt-auto">
            <div className="bg-dark-900/50 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-gray-400">Total Responses</div>
              <div className="text-3xl font-bold text-white">{analytics.totalResponses}</div>
            </div>
            <div className="bg-dark-900/50 border border-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
              <div className="text-sm text-gray-400">Active Viewers</div>
              <div className="text-3xl font-bold text-white flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{activeUsers}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Share Card */}
        <div className="card p-6 flex flex-col items-center justify-center text-center">
          <div className="bg-white p-2 rounded-xl mb-4">
            <QRCodeSVG 
              value={`${window.location.origin}/p/${poll.shortCode}`} 
              size={120} 
            />
          </div>
          <h3 className="font-bold text-white mb-1">Join Code: <span className="tracking-widest font-mono text-primary">{poll.shortCode}</span></h3>
          <button 
            onClick={copyLink}
            className="mt-4 flex items-center justify-center w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl transition-all text-sm font-medium"
          >
            {copied ? <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-400" /> : <Copy className="w-4 h-4 mr-2" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="space-y-8 relative z-10">
        <h2 className="text-2xl font-bold text-white">Question Summaries</h2>
        
        {poll.questions.map((q, index) => {
          const chartData = q.options.map(opt => ({
            name: opt.text.length > 20 ? opt.text.substring(0, 20) + '...' : opt.text,
            fullName: opt.text,
            count: getOptionCount(q._id, opt._id)
          }));

          return (
            <div key={q._id} className="card p-6 md:p-8">
              <h3 className="text-lg font-semibold text-white mb-6">Q{index + 1}: {q.text}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Chart */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#666" tick={{fill: '#888'}} />
                      <YAxis dataKey="name" type="category" width={100} stroke="#666" tick={{fontSize: 12, fill: '#888'}} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#13131A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                        formatter={(value) => [`${value} responses`, 'Count']}
                        labelFormatter={(label) => {
                          const item = chartData.find(d => d.name === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* List View */}
                <div className="space-y-3">
                  {q.options.map(opt => {
                    const count = getOptionCount(q._id, opt._id);
                    const percentage = analytics.totalResponses > 0 
                      ? Math.round((count / analytics.totalResponses) * 100) 
                      : 0;

                    return (
                      <div key={opt._id} className="bg-dark-900/50 p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-200">{opt.text}</span>
                          <span className="font-bold text-primary">{count} <span className="text-gray-500 text-sm font-normal">({percentage}%)</span></span>
                        </div>
                        <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-1000 ease-out relative" 
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 w-full h-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PollResults;
