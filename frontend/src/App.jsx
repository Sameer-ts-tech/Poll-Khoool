import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreatePoll from './pages/CreatePoll';
import TakePoll from './pages/TakePoll';
import PollResults from './pages/PollResults';
import HostQuiz from './pages/HostQuiz';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create-poll" element={<CreatePoll />} />
          <Route path="/p/:identifier" element={<TakePoll />} />
          <Route path="/r/:identifier" element={<PollResults />} />
          <Route path="/host/:identifier" element={<HostQuiz />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
