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
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ProjectModal, projectsData } from './Projects';
import { useState } from 'react';

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

const ProjectCard = ({ project, onViewDetails, index }) => {
  const variants = {
    hidden: { 
      opacity: 0, 
      x: index % 3 === 0 ? -150 : (index % 3 === 2 ? 150 : 0),
      y: index % 3 === 1 ? 100 : 0
    },
    visible: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: { duration: 0.9, ease: "easeOut" }
    }
  };

  const getGradient = (title) => {
    const gradients = [
      'from-blue-600 to-indigo-700',
      'from-emerald-500 to-teal-700',
      'from-purple-600 to-indigo-800',
      'from-amber-500 to-orange-700',
      'from-rose-500 to-pink-700',
      'from-cyan-500 to-blue-700'
    ];
    const index = (title?.length || 0) % gradients.length;
    return gradients[index];
  };

  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, margin: "-50px" }}
      variants={variants}
      whileHover={{ 
        y: [0, -10, 0],
        transition: { 
          duration: 2, 
          repeat: Infinity, 
          ease: "easeInOut" 
        } 
      }}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-300 cursor-default flex flex-col h-full group"
    >
      <div className={`relative h-44 bg-gradient-to-br ${getGradient(project.title)} p-6 flex flex-col justify-between overflow-hidden group-hover:shadow-inner transition-all`}>
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full border-4 border-white"></div>
          <div className="absolute -left-6 -bottom-6 w-48 h-48 rounded-full border-8 border-white opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full border border-white/20 rotate-45"></div>
        </div>

        <div className="relative z-10 flex justify-between items-start">
          <span className="bg-white/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/30">
            {project.department?.name || (typeof project.department === 'string' ? project.department : 'General')}
          </span>
          <div className={`bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            project.status === 'Completed' ? 'text-green-600' : 'text-orange-600'
          }`}>
            {project.status}
          </div>
        </div>

        <div className="relative z-10">
          <GraduationCap className="text-white/40 mb-2" size={32} />
          <h4 className="text-white font-black text-xl leading-tight line-clamp-2 drop-shadow-sm group-hover:scale-[1.02] transition-transform">
            {project.title}
          </h4>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-gray-600 text-sm mb-6 leading-relaxed line-clamp-3 italic">
          &quot;{project.description || project.abstract}&quot;
        </p>
        
        <div className="mt-auto space-y-4 pt-4 border-t border-gray-50 text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 uppercase">
                {(project.teamName || 'T').charAt(0)}
              </div>
              <span className="text-gray-900 font-bold text-xs truncate max-w-[120px]">{project.teamName}</span>
            </div>
            <button 
              onClick={() => onViewDetails(project)}
              className="text-blue-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 hover:gap-2.5 transition-all group/btn bg-blue-50 px-3 py-2 rounded-lg"
            >
              Details <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedProjects = ({ onProjectSelect }) => {
  const navigate = useNavigate();
  const featuredProjects = projectsData.slice(0, 3);

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProjects.map((project, index) => (
            <ProjectCard 
              key={project._id || project.id} 
              index={index}
              project={project}
              onViewDetails={onProjectSelect}
            />
          ))}
        </div>
        <div className="text-center">
          <button 
            onClick={() => navigate('/projects')}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 cursor-pointer"
          >
            View All Projects
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
