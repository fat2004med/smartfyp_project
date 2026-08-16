import { 
  Users, 
  CheckSquare, 
  FileText, 
  Calendar, 
  BarChart3, 
  Briefcase, 
  GraduationCap, 
  UserCheck, 
  Building2,
  Monitor,
  ArrowRight,
  Code,
  Shield,
  Database,
  Brain,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ProjectModal, ProjectCard } from './Projects';
import { useState, useEffect } from 'react';

const Hero = () => {
  const navigate = useNavigate();
  return (
    <section className="relative pt-32 pb-20 min-h-[700px] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Students working" 
          className="w-full h-full object-cover opacity-90"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"></div>
      </div>
      
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 md:p-12 rounded-2xl shadow-xl max-w-xl border border-gray-100"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Streamline Your <br />
            <span className="text-blue-600">Final Year Projects</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg leading-relaxed">
            Empowering academic excellence through a comprehensive project management system. Designed for colleges to efficiently manage final year projects across multiple departments with specialized role-based access for every user.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4">
            <button 
              onClick={() => navigate('/projects')}
              className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 font-semibold"
            >
              Explore Projects
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto bg-white text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-all font-semibold"
            >
              Get Started
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FeatureCard = ({ icon: Icon, title, description, index }) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      x: index % 3 === 0 ? -100 : (index % 3 === 2 ? 100 : 0),
      y: index % 3 === 1 ? 50 : 0
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { duration: 0.8, ease: "easeOut" }
    }
  };

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-50px" }}
      variants={variants}
      whileHover={{ 
        y: [0, -8, 0],
        transition: { 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } 
      }}
      className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm hover:shadow-xl transition-shadow cursor-default"
    >
      <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-6 border border-blue-100">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </motion.div>
  );
};

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Multi-Role Management",
      description: "Dedicated dashboards for team members, team leaders, supervisors, HODs, and administrators with role-specific functionalities for every user."
    },
    {
      icon: Building2,
      title: "Department Structure",
      description: "Organized hierarchy from departments to teams, ensuring clear reporting lines and efficient project oversight."
    },
    {
      icon: CheckSquare,
      title: "Task Management",
      description: "Comprehensive task assignment, tracking, and progress monitoring with deadline management and notifications."
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Secure file upload, version control, and document sharing with approval workflows and feedback systems."
    },
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Meeting scheduling, deadline tracking, and milestone management with automated reminders and notifications."
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Real-time progress tracking, performance analytics, and comprehensive reporting for all stakeholders."
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden border-y border-gray-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Powerful Features for Project Success</h2>
          <p className="text-gray-600 text-lg">Everything you need to manage final year projects efficiently across your entire institution</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index} 
              index={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Stats = () => {
  const stats = [
    { icon: Briefcase, value: "500+", label: "Active Projects" },
    { icon: GraduationCap, value: "2,500+", label: "Students" },
    { icon: UserCheck, value: "150+", label: "Supervisors" },
    { icon: Building2, value: "25+", label: "Departments" }
  ];

  return (
    <section className="py-20 bg-blue-600 text-white overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>
      
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Leading Institutions</h2>
          <p className="text-blue-100 text-lg">Join thousands of students and faculty members who rely on our platform for successful project management</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <stat.icon size={32} />
              </div>
              <div className="text-4xl font-bold mb-2">{stat.value}</div>
              <div className="text-blue-100 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturedProjects = ({ onProjectSelect }) => {
  const navigate = useNavigate();
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchProjects = async () => {
      try {
        const { data } = await axios.get('/api/projects/public');
        if (isMounted) {
          const completedList = Array.isArray(data) 
            ? data.filter(p => p.status === 'Completed' || p.status === 'Published')
            : [];
          setFeaturedProjects(completedList.slice(0, 3));
        }
      } catch (err) {
        console.warn('Could not load featured projects:', err);
        if (isMounted) setFeaturedProjects([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchProjects();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="py-24 bg-white overflow-hidden border-y border-gray-50">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Featured Student Projects</h2>
          <p className="text-gray-600 text-lg">Discover innovative projects created by our talented students across various departments</p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-gray-100 rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : featuredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredProjects.map((project, index) => (
              <ProjectCard 
                key={project._id || project.id || index} 
                index={index}
                project={project}
                onViewDetails={onProjectSelect}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-blue-50/50 rounded-3xl border border-blue-100 max-w-2xl mx-auto mb-12">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Live Database Connected</h3>
            <p className="text-gray-500 text-sm">
              Completed and published final-year projects from your institution will appear here automatically.
            </p>
          </div>
        )}

        <div className="text-center">
          <button 
            onClick={() => navigate('/projects')}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 cursor-pointer"
          >
            Explore Projects Gallery
          </button>
        </div>
      </div>
    </section>
  );
};

const DeptCard = ({ icon: Icon, title, projects, students, index }) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      x: index % 3 === 0 ? -80 : (index % 3 === 2 ? 80 : 0),
      y: index % 3 === 1 ? 60 : 0
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { duration: 0.7, ease: "easeOut" }
    }
  };

  const colors = [
    'bg-blue-50 text-blue-600 border-blue-100',
    'bg-green-50 text-green-600 border-green-100',
    'bg-orange-50 text-orange-600 border-orange-100',
    'bg-purple-50 text-purple-600 border-purple-100',
    'bg-indigo-50 text-indigo-600 border-indigo-100',
    'bg-yellow-50 text-yellow-600 border-yellow-100'
  ];

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-50px" }}
      variants={variants}
      whileHover={{ 
        y: [0, -8, 0],
        transition: { 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } 
      }}
      className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-xl transition-shadow cursor-default"
    >
      <div className={`w-16 h-16 ${colors[index % colors.length]} rounded-2xl flex items-center justify-center mb-6 border`}>
        <Icon size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-4">{title}</h3>
      <div className="w-full space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Active Projects</span>
          <span className="font-bold text-blue-600">{projects}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Students</span>
          <span className="font-bold text-blue-600">{students}</span>
        </div>
      </div>
    </motion.div>
  );
};

const Departments = () => {
  const depts = [
    { icon: Monitor, title: "Computer Science", projects: 45, students: 180 },
    { icon: LayoutDashboard, title: "Information Technology", projects: 40, students: 160 },
    { icon: Code, title: "Software Engineering", projects: 38, students: 152 },
    { icon: Database, title: "Data Science", projects: 42, students: 168 },
    { icon: Brain, title: "Artificial Intelligence", projects: 35, students: 140 },
    { icon: Shield, title: "Cyber Security", projects: 33, students: 132 }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Modern Campus" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-blue-900/80 backdrop-blur-[2px]"></div>
      </div>

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Departments & Specializations</h2>
          <p className="text-blue-100 text-lg">Our comprehensive system supports all engineering departments with specialized project management tools</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {depts.map((dept, index) => (
            <DeptCard 
              key={index} 
              index={index}
              icon={dept.icon}
              title={dept.title}
              projects={dept.projects}
              students={dept.students}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const CTA = () => {
  const navigate = useNavigate();
  return (
    <section className="py-24 bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: false }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Transform Your Project Management?</h2>
          <p className="text-blue-100 text-xl mb-10 max-w-2xl mx-auto">
            Join our platform and experience seamless collaboration, efficient tracking, and successful project delivery across all departments.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-blue-600 px-10 py-4 rounded-xl hover:bg-blue-50 transition-all font-bold text-lg shadow-xl"
            >
              Get Started Today
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="bg-transparent border-2 border-white text-white px-10 py-4 rounded-xl hover:bg-white/10 transition-all font-bold text-lg"
            >
              Contact Us
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Home = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Stats />
      <FeaturedProjects onProjectSelect={setSelectedProject} />
      <Departments />
      <CTA />

      <AnimatePresence>
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
