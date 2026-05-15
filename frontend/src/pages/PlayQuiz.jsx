import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, AlertCircle, CheckCircle2 } from 'lucide-react';
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

  return <span className="font-mono text-3xl font-bold text-primary animate-pulse">{timeLeft}s</span>;
};

const PlayQuiz = ({ poll, socket, activeUsers }) => {
  const [quizState, setQuizState] = useState('waiting'); 
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [endTime, setEndTime] = useState(null);
  
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); 
  const [isReady, setIsReady] = useState(false);

  const handleImReady = () => {
    // Play a tiny silent sound to unlock audio
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==');
    audio.play().catch(() => {});
    setIsReady(true);
  };

  useEffect(() => {
    if (!socket) return;
    
    if (poll.status === 'active' && poll.currentQuestionIndex >= 0) {
    }

    const onQuestionPublished = (data) => {
      if (data.questionIndex === 0) {
        const audio = new Audio(kbcSound);
        audio.play().catch(e => console.error("Audio playback blocked:", e));
      }
      setActiveQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setEndTime(data.endTime);
      setQuizState('active');
      setSelectedOption(null);
      setFeedback(null);
    };

    socket.on('question_published', onQuestionPublished);

    return () => {
      socket.off('question_published', onQuestionPublished);
    };
  }, [socket, poll]);

  const submitAnswer = async (optionId) => {
    if (quizState !== 'active' || submitting) return;
    
    setSelectedOption(optionId);
    setSubmitting(true);
    
    try {
       const timeLimitMs = activeQuestion.timeLimit * 1000;
       const remaining = endTime - Date.now();
       const timeTaken = timeLimitMs - remaining;
       
       const visitorId = localStorage.getItem('visitorId');
       
       const res = await axios.post(`/api/polls/${poll._id}/quiz-response`, {
         questionId: activeQuestion._id,
         optionId,
         timeTaken: Math.max(0, timeTaken),
         participantId: visitorId
       });
       
       setFeedback(res.data);
    } catch (e) {
       console.error(e);
       if (e.response?.status === 400) {
         setFeedback({ isCorrect: false, pointsEarned: 0, totalScore: 'N/A' });
       }
    } finally {
       setSubmitting(false);
    }
  };

  const handleTimerExpire = () => {
    setQuizState('feedback');
  };

  if (quizState === 'waiting') {
    return (
       <div className="card p-12 text-center max-w-lg mx-auto mt-20 animate-fade-in relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[50px]"></div>
         <div className="w-20 h-20 bg-dark-800 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(139,92,246,0.3)] animate-pulse">
           <Users className="w-10 h-10 text-primary" />
         </div>
         <h2 className="text-3xl font-extrabold text-white mb-2">{poll.title}</h2>
         <p className="text-gray-400 mb-8 text-lg">Waiting for the host to start...</p>
         
         {!isReady ? (
           <button 
             onClick={handleImReady}
             className="btn-primary px-10 py-4 text-xl shadow-[0_0_40px_rgba(139,92,246,0.4)] animate-bounce"
           >
             I'm Ready! 🚀
           </button>
         ) : (
           <div className="space-y-6">
             <div className="bg-emerald-500/10 py-3 px-6 rounded-xl inline-block border border-emerald-500/20 text-emerald-400 font-bold">
               <CheckCircle2 className="w-5 h-5 inline mr-2" />
               Audio Unlocked & Ready
             </div>
             <br />
             <div className="bg-dark-900/50 py-3 px-6 rounded-xl inline-block border border-white/5">
               <span className="text-emerald-400 font-bold text-xl mr-2">{activeUsers}</span> 
               <span className="text-gray-400 font-medium tracking-wide">players connected</span>
             </div>
           </div>
         )}
       </div>
    );
  }

  if (quizState === 'feedback') {
    const isCorrect = feedback ? feedback.isCorrect : false;
    const hasAnswered = selectedOption !== null;

    return (
       <div className={`card p-12 text-center max-w-lg mx-auto mt-20 border-2 animate-slide-up ${hasAnswered ? (isCorrect ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-red-500/50 bg-red-500/10') : 'border-amber-500/50 bg-amber-500/10'}`}>
         {hasAnswered ? (
           isCorrect ? (
             <>
               <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
               <h2 className="text-4xl font-extrabold text-emerald-400 mb-2">Correct!</h2>
               <p className="text-emerald-400/80 mb-8 text-xl font-bold">+{feedback.pointsEarned} points</p>
             </>
           ) : (
             <>
               <AlertCircle className="w-20 h-20 text-red-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
               <h2 className="text-4xl font-extrabold text-red-400 mb-2">Incorrect</h2>
               <p className="text-red-400/80 mb-8 text-xl">Better luck next time.</p>
             </>
           )
         ) : (
           <>
             <AlertCircle className="w-20 h-20 text-amber-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
             <h2 className="text-4xl font-extrabold text-amber-400 mb-2">Time's Up!</h2>
             <p className="text-amber-400/80 mb-8 text-xl">You didn't answer in time.</p>
           </>
         )}
         
         {feedback && (
           <div className="bg-dark-900/80 py-4 px-8 rounded-2xl inline-block border border-white/10 shadow-2xl">
             <p className="text-gray-400 text-sm uppercase tracking-wider mb-1 font-semibold">Total Score</p>
             <p className="text-white font-black text-3xl">{feedback.totalScore}</p>
           </div>
         )}
         {!feedback && hasAnswered && (
           <div className="animate-pulse text-gray-400">Calculating score...</div>
         )}
         
         <div className="mt-12 text-gray-500 text-sm animate-pulse">
           Waiting for host to publish next question...
         </div>
       </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in relative z-10">
       <div className="flex justify-between items-center mb-8 bg-dark-800/60 p-4 px-6 rounded-2xl border border-white/10 shadow-xl">
         <span className="bg-primary/20 text-primary font-bold px-4 py-1.5 rounded-full border border-primary/30">
           Question {questionIndex + 1} of {poll.questions.length}
         </span>
         <div className="flex items-center space-x-3">
           <span className="text-gray-400 text-sm uppercase tracking-wider font-semibold hidden sm:inline">Time Left</span>
           <Countdown targetDate={endTime} onExpire={handleTimerExpire} />
         </div>
       </div>
       
       <div className="card p-8 md:p-12 mb-8 text-center border border-white/10 shadow-2xl">
         <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">{activeQuestion.text}</h2>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
         {activeQuestion.options.map((opt, i) => {
           const isSelected = selectedOption === opt._id;
           const colors = [
             'hover:bg-blue-600 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]',
             'hover:bg-red-600 hover:border-red-400 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]',
             'hover:bg-amber-500 hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]',
             'hover:bg-emerald-600 hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(5,150,105,0.4)]'
           ];
           const colorClass = colors[i % 4];

           return (
             <button
               key={opt._id}
               onClick={() => submitAnswer(opt._id)}
               disabled={selectedOption !== null}
               className={`p-6 md:p-8 rounded-2xl text-xl md:text-2xl font-bold transition-all duration-300 transform ${
                 isSelected 
                   ? 'bg-white text-dark-900 scale-[1.02] shadow-[0_0_30px_rgba(255,255,255,0.5)] border-2 border-white'
                   : selectedOption !== null 
                     ? 'bg-dark-800 border-2 border-white/5 text-gray-600 opacity-50 scale-[0.98]'
                     : `bg-dark-800 border-2 border-white/10 text-white ${colorClass} hover:-translate-y-1`
               }`}
             >
               {opt.text}
             </button>
           );
         })}
       </div>
    </div>
  );
};

export default PlayQuiz;
