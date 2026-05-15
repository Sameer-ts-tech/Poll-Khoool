import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, BarChart2, Calendar, Link as LinkIcon } from 'lucide-react';

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await axios.get('/api/polls/creator/me');
        setPolls(res.data);
      } catch (err) {
        console.error('Error fetching polls', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPolls();
    }
  }, [user]);

  if (loading) {
    return <div className="text-center py-12 animate-pulse text-gray-400">Loading your dashboard...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 animate-fade-in relative">
      <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="flex justify-between items-center mb-10 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Polls</h1>
          <p className="text-gray-400 mt-1">Manage and view analytics for your created polls.</p>
        </div>
        <Link to="/create-poll" className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Poll</span>
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="text-center py-16 glass-card relative z-10">
          <BarChart2 className="w-16 h-16 text-primary/50 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No polls yet</h3>
          <p className="text-gray-400 mb-8 max-w-sm mx-auto">Create your first poll to start gathering feedback from your audience in real-time.</p>
          <Link to="/create-poll" className="btn-primary">Create Your First Poll</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {polls.map((poll) => (
            <div key={poll._id} className="card hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)] transition-all duration-300 flex flex-col group p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-xl text-white line-clamp-1 group-hover:text-primary transition-colors">{poll.title}</h3>
                {poll.isQuiz && <span className="bg-primary/20 text-primary text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-primary/30 ml-2 whitespace-nowrap">Quiz</span>}
              </div>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2 h-10">
                {poll.description || 'No description provided.'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500 mb-6">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{new Date(poll.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-md text-primary/80">
                  {poll.shortCode}
                </div>
              </div>

              <div className="mt-auto flex space-x-3 pt-4 border-t border-white/5">
                <Link to={poll.isQuiz ? `/host/${poll._id}` : `/r/${poll._id}`} className="flex-1 text-center py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white font-medium rounded-xl transition-all duration-300">
                  {poll.isQuiz ? 'Host Dashboard' : 'Analytics'}
                </Link>
                <Link to={`/p/${poll.shortCode}`} className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300" title="Go to poll">
                  <LinkIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
