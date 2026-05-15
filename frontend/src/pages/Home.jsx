import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Activity, Users, Lock, Sparkles, CheckCircle2, AlertCircle, Trophy } from 'lucide-react';

const HeroAnimation = () => {
  const [bars, setBars] = useState([40, 70, 45, 90, 65, 50, 80]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBars(prev => prev.map(val => {
        const change = (Math.random() - 0.5) * 30;
        return Math.min(Math.max(val + change, 20), 100);
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 w-64 h-64 md:w-[500px] md:h-[400px] opacity-20 pointer-events-none hidden lg:block overflow-hidden">
      <div className="absolute inset-0 bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="relative h-full flex items-end justify-between px-8 pb-12 space-x-4">
        {bars.map((height, i) => (
          <div 
            key={i} 
            className="w-full bg-gradient-to-t from-primary/60 to-transparent rounded-t-2xl transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(139,92,246,0.2)]" 
            style={{ height: `${height}%` }}
          ></div>
        ))}
      </div>
    </div>
  );
};

const AnimatedChartDemo = () => {
  const [data, setData] = useState([
    { name: 'A', votes: 45 },
    { name: 'B', votes: 72 },
    { name: 'C', votes: 38 },
    { name: 'D', votes: 85 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => {
        const change = (Math.random() - 0.5) * 50; 
        let newVal = item.votes + change;
        if (newVal > 95) newVal = 40 + (Math.random() * 40);
        if (newVal < 10) newVal = 20 + (Math.random() * 40);
        return { ...item, votes: newVal };
      }));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-48 flex items-end justify-between px-4 pb-2 space-x-4">
      {data.map((item, i) => (
        <div key={i} className="flex-1 h-full flex flex-col justify-end items-center group">
          <div 
            className="w-full bg-gradient-to-t from-primary to-violet-400 rounded-t-xl transition-all duration-700 ease-in-out shadow-[0_0_30px_rgba(139,92,246,0.4)] group-hover:brightness-125 relative" 
            style={{ height: `${item.votes}%` }}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/30 rounded-t-xl"></div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              {Math.round(item.votes)}%
            </div>
          </div>
          <span className="text-[10px] text-gray-500 mt-2 font-bold tracking-widest">{item.name}</span>
        </div>
      ))}
    </div>
  );
};

const DemoLeaderboard = () => {
  const [players, setPlayers] = useState([
    { name: 'Sameer', score: 2450 },
    { name: 'Aaudh', score: 2120 },
    { name: 'Shivam', score: 1890 },
    { name: 'Prashant', score: 1450 }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayers(prev => {
        const next = [...prev];
        const randomIdx = Math.floor(Math.random() * next.length);
        next[randomIdx] = { ...next[randomIdx], score: next[randomIdx].score + Math.floor(Math.random() * 300) };
        return next.sort((a, b) => b.score - a.score);
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      {players.map((player, i) => (
        <div 
          key={player.name} 
          className="flex justify-between items-center bg-white/5 border border-white/5 p-3 rounded-xl transition-all duration-500"
          style={{ transform: `translateY(${i * 4}px)` }}
        >
          <div className="flex items-center space-x-3">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-amber-400 text-dark-900' : 'bg-white/10 text-gray-400'}`}>
              {i + 1}
            </span>
            <span className="text-sm font-medium text-white">{player.name}</span>
          </div>
          <span className="text-xs font-bold text-primary">{player.score}</span>
        </div>
      ))}
    </div>
  );
};
const MockQuiz = () => {
  const [step, setStep] = useState('start'); // start, question, feedback
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  
  const demoQ = {
    text: "Which hook is used to manage state in react?",
    options: ["useState", "useEffect", "useContext", "useReducer"],
    correct: 0
  };

  useEffect(() => {
    if (step === 'question' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && step === 'question') {
      setStep('feedback');
    }
  }, [step, timeLeft]);

  const handleStart = () => {
    setStep('question');
    setTimeLeft(10);
    setSelected(null);
  };

  const handleSelect = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => setStep('feedback'), 800);
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-24 mb-12 animate-slide-up" style={{ animationDelay: '0.5s' }}>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Experience the Thrill</h2>
        <p className="text-gray-400">Try our interactive quiz engine right here</p>
      </div>

      <div className="card p-8 min-h-[340px] flex flex-col justify-center relative overflow-hidden border-primary/20 shadow-[0_0_50px_rgba(139,92,246,0.1)]">
        {step === 'start' && (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-6">Ready for a 10-second challenge?</h3>
            <button onClick={handleStart} className="btn-primary px-10 py-3 text-lg">Start Demo Quiz</button>
          </div>
        )}

        {step === 'question' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
              <span className="text-primary font-bold px-3 py-1 bg-primary/10 rounded-full border border-primary/20 text-xs uppercase tracking-widest">Demo Quiz</span>
              <span className="text-2xl font-mono font-bold text-white bg-dark-900 px-4 py-1 rounded-lg border border-white/5">{timeLeft}s</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-8 text-center">{demoQ.text}</h3>
            <div className="grid grid-cols-2 gap-4">
              {demoQ.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  className={`p-4 rounded-xl font-bold transition-all border-2 ${
                    selected === i 
                    ? 'bg-primary border-white text-white scale-95 shadow-[0_0_20px_rgba(139,92,246,0.5)]' 
                    : 'bg-dark-900 border-white/5 text-gray-300 hover:border-primary/50 hover:bg-white/5'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'feedback' && (
          <div className="text-center animate-slide-up">
            {selected === demoQ.correct ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-3xl font-extrabold text-emerald-400 mb-2">Correct!</h3>
                <p className="text-gray-400 mb-6">You earned 850 points for that speed!</p>
              </>
            ) : (
              <>
                <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-3xl font-extrabold text-red-400 mb-2">{selected === null ? "Time's Up!" : "Incorrect"}</h3>
                <p className="text-gray-400 mb-6">The correct answer was {demoQ.options[demoQ.correct]}</p>
              </>
            )}
            <button onClick={handleStart} className="text-primary hover:text-white font-medium transition-colors">Try again</button>
          </div>
        )}
      </div>
    </div>
  );
};
const Home = () => {
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/p/${joinCode.trim()}`);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[85vh] py-12 overflow-hidden animate-fade-in">
      
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000"></div>
      
      <HeroAnimation />

      <div className="relative z-10 max-w-4xl w-full text-center space-y-8 px-4">
        
        <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4 animate-slide-up">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-gray-300">The next generation of live polling</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Live Polling & <br className="hidden md:block" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-flow">Gamified Quizzes.</span>
        </h1>
        
        <p className="text-xl text-gray-400 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Host interactive polls and high-energy live quizzes. Share instantly via QR codes and watch the leaderboard change in real-time with our Kahoot-style engine.
        </p>

        <div className="glass-card p-6 md:p-8 max-w-md mx-auto relative overflow-hidden mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
          <form onSubmit={handleJoin} className="space-y-5">
            <label className="block text-sm font-medium text-gray-300 text-left">
              Join a Live Session (Poll or Quiz)
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="input-field text-lg text-center uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal font-mono"
                maxLength={6}
              />
              <button type="submit" className="btn-primary flex items-center justify-center px-6">
                Join
              </button>
            </div>
          </form>
          
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-sm text-gray-400 mb-4">Or create your own poll in seconds</p>
            {user ? (
              <Link to="/create-poll" className="btn-secondary w-full flex items-center justify-center space-x-2">
                <span>Create New Poll</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/register" className="btn-secondary w-full flex items-center justify-center space-x-2">
                <span>Get Started for Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="card p-6 hover:-translate-y-1 transition-transform duration-300 border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 text-primary border border-primary/20 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Live Analytics</h3>
            <p className="text-gray-400 text-sm">Watch charts update instantly as responses roll in through our high-speed WebSockets.</p>
          </div>
          <div className="card p-6 hover:-translate-y-1 transition-transform duration-300 border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mb-4 text-secondary border border-secondary/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Gamified Quizzes</h3>
            <p className="text-gray-400 text-sm">Host competitive live quizzes with per-question timers, correct answers, and dynamic leaderboards.</p>
          </div>
          <div className="card p-6 hover:-translate-y-1 transition-transform duration-300 border-white/5 bg-gradient-to-b from-white/5 to-transparent">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-white">Kahoot-Style Experience</h3>
            <p className="text-gray-400 text-sm">A fast-paced, high-integrity experience with speed-based scoring and beautiful visual feedback.</p>
          </div>
        </div>

        <MockQuiz />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-32 items-center text-left animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div>
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Real-time Competition</span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">Built for High Energy.</h2>
            <p className="text-gray-400 text-lg mb-8">
              Whether it's a corporate event or a classroom challenge, our low-latency WebSocket engine ensures everyone is synced to the second.
            </p>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Speed-based Scoring</h4>
                  <p className="text-gray-500 text-sm">The faster you answer, the more points you earn.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-secondary/20 rounded-full flex items-center justify-center mt-1">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                </div>
                <div>
                  <h4 className="text-white font-semibold">Instant Visualization</h4>
                  <p className="text-gray-500 text-sm">Watch the crowd's opinion shift with every single click.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Responses</h3>
                <Activity className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <AnimatedChartDemo />
            </div>
            <div className="card p-6 bg-gradient-to-br from-dark-800 to-dark-900 border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Live Leaderboard</h3>
                <Users className="w-4 h-4 text-secondary" />
              </div>
              <DemoLeaderboard />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;
