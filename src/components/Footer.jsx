import { 
  LayoutDashboard, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Mail, 
  Phone, 
  MapPin 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-20 pb-10">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="text-white" size={24} />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-white font-bold text-xl tracking-tight">Smart<span className="text-blue-600">FYP</span></span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">Management System</span>
              </div>
            </Link>
            <p className="text-sm leading-relaxed">
              Comprehensive project management system for educational institutions, streamlining final year projects across all departments.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"><Linkedin size={18} /></a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"><Instagram size={18} /></a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Quick Links</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
              <li><Link to="/projects" className="hover:text-blue-500 transition-colors">Projects</Link></li>
              <li><Link to="/about" className="hover:text-blue-500 transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-blue-500 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">For Users</h4>
            <ul className="space-y-4 text-sm">
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Team Member</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Team Leader</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Supervisor</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">HOD</Link></li>
              <li><Link to="/login" className="hover:text-blue-500 transition-colors">Admin</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Contact Info</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <MapPin size={18} className="text-blue-500 shrink-0" />
                <span>Govt. Graduate College Township, College Road, Lahore.</span>
              </li>
              <li className="flex gap-3">
                <Phone size={18} className="text-blue-500 shrink-0" />
                <span>(042) 99262112</span>
              </li>
              <li className="flex gap-3">
                <Mail size={18} className="text-blue-500 shrink-0" />
                <span>gcbtownship@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2024 Project Management System. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <p>Powered by Readdy</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
