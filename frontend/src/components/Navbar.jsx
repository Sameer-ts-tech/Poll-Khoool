import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import logo from '../assets/pollingimage.png';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-nav">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center group">
          <img src={logo} alt="Poll Khoool Logo" className="h-14 w-auto object-contain" />
        </Link>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/dashboard" className="text-gray-300 hover:text-white font-medium transition-colors">
                Dashboard
              </Link>
              <Link to="/create-poll" className="btn-primary py-1.5 px-4 text-sm hidden sm:block">
                Create Poll
              </Link>
              <div className="h-6 w-px bg-white/10 mx-2"></div>
              <div className="flex items-center space-x-2 text-gray-300">
                <div className="bg-dark-800 p-1.5 rounded-full border border-white/10">
                  <UserIcon className="w-4 h-4 text-gray-400" />
                </div>
                <span className="font-medium hidden sm:block">{user.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-400 transition-colors p-1"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">
                Login
              </Link>
              <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
