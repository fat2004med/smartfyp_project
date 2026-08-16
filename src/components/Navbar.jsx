import { 
  GraduationCap, 
  Menu, 
  X 
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavLink = ({ to, children, scrolled }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      className={`transition-colors font-medium relative group py-2 ${
        scrolled ? (isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600') : (isActive ? 'text-blue-200' : 'text-white hover:text-blue-200')
      }`}
    >
      {children}
      <span className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ${
        isActive ? 'w-full' : 'w-0 group-hover:w-full'
      } ${
        scrolled ? 'bg-blue-600' : 'bg-white'
      }`}></span>
    </Link>
  );
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Force scrolled state on non-home pages if needed, or keep it transparent
  const isHomePage = location.pathname === '/';

  const getDashboardPath = () => {
    if (!user) return '/login';
    const rolesArray = user.role ? user.role.split(',').map(r => r.trim()) : [];
    const primaryRole = rolesArray[0] || 'Team Member';
    return `/dashboard/${primaryRole.toLowerCase().replace(/\s+/g, '-')}`;
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled || !isHomePage
        ? 'bg-white/90 backdrop-blur-md shadow-md border-b border-gray-100 py-2' 
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className={`font-bold text-xl tracking-tight transition-colors duration-300 ${
                scrolled || !isHomePage ? 'text-gray-900' : 'text-white'
              }`}>
                Smart<span className={scrolled || !isHomePage ? 'text-blue-600' : 'text-blue-300'}>FYP</span>
              </span>
              <span className={`text-[10px] font-medium uppercase tracking-widest hidden sm:block transition-colors duration-300 ${
                scrolled || !isHomePage ? 'text-gray-500' : 'text-white/80'
              }`}>
                Management System
              </span>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/" scrolled={scrolled || !isHomePage}>Home</NavLink>
            <NavLink to="/projects" scrolled={scrolled || !isHomePage}>Projects</NavLink>
            <NavLink to="/ideas" scrolled={scrolled || !isHomePage}>Project Ideas</NavLink>
            <NavLink to="/about" scrolled={scrolled || !isHomePage}>About</NavLink>
            <NavLink to="/contact" scrolled={scrolled || !isHomePage}>Contact</NavLink>
            <Link to={getDashboardPath()}>
              <button className={`px-6 py-2 rounded-md transition-all font-medium shadow-lg ${
                scrolled || !isHomePage
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100' 
                  : 'bg-white text-blue-600 hover:bg-blue-50 shadow-black/10'
              }`}>
                {user ? 'Dashboard' : 'Login'}
              </button>
            </Link>
          </div>

          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className={`p-2 transition-colors ${scrolled || !isHomePage ? 'text-gray-600' : 'text-white'}`}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-gray-100 px-4 py-6 space-y-4 shadow-xl"
        >
          <Link to="/" className="block text-gray-600 hover:text-blue-600 font-medium transition-colors" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/projects" className="block text-gray-600 hover:text-blue-600 font-medium transition-colors" onClick={() => setIsOpen(false)}>Projects</Link>
          <Link to="/ideas" className="block text-gray-600 hover:text-blue-600 font-medium transition-colors" onClick={() => setIsOpen(false)}>Project Ideas</Link>
          <Link to="/about" className="block text-gray-600 hover:text-blue-600 font-medium transition-colors" onClick={() => setIsOpen(false)}>About</Link>
          <Link to="/contact" className="block text-gray-600 hover:text-blue-600 font-medium transition-colors" onClick={() => setIsOpen(false)}>Contact</Link>
          <Link to={getDashboardPath()} onClick={() => setIsOpen(false)}>
            <button className="w-full bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium shadow-lg shadow-blue-200">
              {user ? 'Dashboard' : 'Login'}
            </button>
          </Link>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
