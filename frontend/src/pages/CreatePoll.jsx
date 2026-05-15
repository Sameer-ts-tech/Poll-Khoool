import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';

const CreatePoll = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [poll, setPoll] = useState({
    title: '',
    description: '',
    isQuiz: false,
    settings: {
      requiresAuth: false,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16), // by default it is set to 7 days
      isPublished: true,
    },
    questions: [
      { text: '', isMandatory: true, options: [{ text: '' }, { text: '' }] }
    ]
  });

  const handleAddQuestion = () => {
    setPoll({
      ...poll,
      questions: [...poll.questions, { text: '', isMandatory: true, options: [{ text: '' }, { text: '' }] }]
    });
  };

  const handleRemoveQuestion = (qIndex) => {
    if (poll.questions.length === 1) return;
    const newQuestions = poll.questions.filter((_, i) => i !== qIndex);
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleQuestionChange = (text, qIndex) => {
    const newQuestions = [...poll.questions];
    newQuestions[qIndex].text = text;
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleMandatoryToggle = (qIndex) => {
    const newQuestions = [...poll.questions];
    newQuestions[qIndex].isMandatory = !newQuestions[qIndex].isMandatory;
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleAddOption = (qIndex) => {
    const newQuestions = [...poll.questions];
    newQuestions[qIndex].options.push({ text: '' });
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleRemoveOption = (qIndex, optIndex) => {
    const newQuestions = [...poll.questions];
    if (newQuestions[qIndex].options.length <= 2) return;
    newQuestions[qIndex].options = newQuestions[qIndex].options.filter((_, i) => i !== optIndex);
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleOptionChange = (text, qIndex, optIndex) => {
    const newQuestions = [...poll.questions];
    newQuestions[qIndex].options[optIndex].text = text;
    setPoll({ ...poll, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!poll.title.trim()) return alert("Title is required");
    for (let q of poll.questions) {
      if (!q.text.trim()) return alert("All questions must have text");
      for (let o of q.options) {
        if (!o.text.trim()) return alert("All options must have text");
      }
    }

    setLoading(true);
    try {
      const res = await axios.post('/api/polls', poll);
      navigate(`/r/${res.data._id}`); // Go to results/dashboard view for this poll
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create poll');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in relative z-10 px-4">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none -z-10"></div>
      <div className="mb-8 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-bold text-white">Create New Poll</h1>
        <p className="text-gray-400 mt-2">Design your questions and customize settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2 text-white">General Details</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Poll Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="input-field text-lg"
              placeholder="E.g., Product Feedback Survey"
              value={poll.title}
              onChange={(e) => setPoll({ ...poll, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="Explain the purpose of this poll..."
              value={poll.description}
              onChange={(e) => setPoll({ ...poll, description: e.target.value })}
            />
          </div>
        </div>

        {/* Settings */}
        <div className="card space-y-4 p-6 md:p-8">
          <h2 className="text-xl font-semibold border-b border-white/10 pb-2 text-white">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Expiry Date & Time</label>
              <input
                type="datetime-local"
                required
                className="input-field bg-white/10 border-white/20 text-white placeholder-gray-400"
                value={poll.settings.expiresAt}
                onChange={(e) => setPoll({ ...poll, settings: { ...poll.settings, expiresAt: e.target.value } })}
              />
            </div>
            <div className="flex flex-col justify-center space-y-3 pt-4 md:pt-6">
              <label className="flex items-center space-x-3 cursor-pointer p-3 bg-primary/10 rounded-xl border border-primary/20 hover:bg-primary/20 transition-colors">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-primary bg-dark-900 border-white/20 rounded focus:ring-primary focus:ring-offset-dark-800"
                  checked={poll.isQuiz}
                  onChange={(e) => setPoll({ ...poll, isQuiz: e.target.checked })}
                />
                <div>
                  <span className="block text-sm font-bold text-white">Enable Live Gamified Quiz Mode</span>
                  <span className="block text-xs text-gray-400 mt-0.5">Time limits, correct answers, and live leaderboard!</span>
                </div>
              </label>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center space-x-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary bg-dark-900 border-white/20 rounded focus:ring-primary focus:ring-offset-dark-800"
                    checked={poll.settings.requiresAuth}
                    onChange={(e) => setPoll({ ...poll, settings: { ...poll.settings, requiresAuth: e.target.checked } })}
                  />
                  <span className="text-sm font-medium text-gray-300">Require login</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-primary bg-dark-900 border-white/20 rounded focus:ring-primary focus:ring-offset-dark-800"
                    checked={poll.settings.isPublished}
                    onChange={(e) => setPoll({ ...poll, settings: { ...poll.settings, isPublished: e.target.checked } })}
                  />
                  <span className="text-sm font-medium text-gray-300">Auto-publish results</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Questions</h2>
          
          {poll.questions.map((q, qIndex) => (
            <div key={qIndex} className="card relative border-l-4 border-l-primary p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-primary/20 text-primary-light font-bold px-3 py-1 rounded-full text-sm">
                  Question {qIndex + 1}
                </span>
                {poll.questions.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => handleRemoveQuestion(qIndex)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Type your question here..."
                    className="w-full bg-transparent font-medium text-xl text-white border-b-2 border-white/10 border-t-0 border-x-0 rounded-none focus:border-primary focus:ring-0 px-0 pb-2 transition-colors placeholder-gray-600 outline-none"
                    value={q.text}
                    onChange={(e) => handleQuestionChange(e.target.value, qIndex)}
                  />
                </div>

                <div className="space-y-2 mt-4 pl-4">
                  {q.options.map((opt, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30 flex-shrink-0"></div>
                      <input
                        type="text"
                        required
                        placeholder={`Option ${optIndex + 1}`}
                        className="flex-1 py-2.5 px-4 bg-dark-900/50 border border-white/10 rounded-xl focus:bg-dark-800 focus:border-primary/50 focus:ring-1 focus:ring-primary/50 text-white outline-none transition-all placeholder-gray-600"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(e.target.value, qIndex, optIndex)}
                      />
                      {q.options.length > 2 && (
                        <button 
                          type="button" 
                          onClick={() => handleRemoveOption(qIndex, optIndex)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={() => handleAddOption(qIndex)}
                    className="text-sm font-medium text-primary flex items-center hover:text-primary/80 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Option
                  </button>
                  
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <span className="text-sm text-gray-400">Required</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary bg-dark-900 border-white/20 rounded focus:ring-primary focus:ring-offset-dark-800"
                      checked={q.isMandatory}
                      onChange={() => handleMandatoryToggle(qIndex)}
                    />
                  </label>
                </div>

                {/* Quiz Settings per Question */}
                {poll.isQuiz && (
                  <div className="mt-4 p-4 bg-dark-900/50 rounded-xl border border-white/10 flex flex-col md:flex-row gap-4 justify-between animate-fade-in">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Time Limit (secs)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        className="input-field py-2 w-32"
                        value={q.timeLimit || 30}
                        onChange={(e) => {
                          const newQuestions = [...poll.questions];
                          newQuestions[qIndex].timeLimit = Number(e.target.value);
                          setPoll({ ...poll, questions: newQuestions });
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Correct Option</label>
                      <select
                        className="input-field py-2 w-full appearance-none bg-dark-800 text-white"
                        value={q.correctOptionIndex !== undefined ? q.correctOptionIndex : ''}
                        onChange={(e) => {
                          const newQuestions = [...poll.questions];
                          newQuestions[qIndex].correctOptionIndex = e.target.value !== '' ? Number(e.target.value) : undefined;
                          setPoll({ ...poll, questions: newQuestions });
                        }}
                        required={poll.isQuiz}
                      >
                        <option value="" disabled>Select the correct answer...</option>
                        {q.options.map((o, i) => (
                          <option key={i} value={i}>Option {i + 1} {o.text ? `(${o.text})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <button 
            type="button"
            onClick={handleAddQuestion}
            className="w-full py-5 border-2 border-dashed border-white/20 rounded-2xl text-gray-400 font-medium hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Another Question</span>
          </button>
        </div>

        <div className="sticky bottom-6 bg-dark-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] border border-white/10 flex justify-end z-20">
          <button 
            type="submit" 
            disabled={loading}
            className={`btn-primary flex items-center px-8 py-3 text-lg ${loading ? 'opacity-70' : ''}`}
          >
            {loading ? 'Creating...' : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Create Poll
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePoll;
