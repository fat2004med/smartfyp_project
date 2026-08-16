import { motion } from 'motion/react';
import { Target, Eye, Users, GraduationCap, Award, BookOpen } from 'lucide-react';

const About = () => {
  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="bg-blue-600 py-20 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
        </div>
        <div className="max-w-[1700px] mx-auto px-4 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            About SmartFYP
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-blue-100 text-xl max-w-3xl mx-auto"
          >
            A Modular Web-based Solution for Academic Project Workflow, designed to streamline the journey from proposal to final approval.
          </motion.p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-[1700px] mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-blue-50 p-10 rounded-3xl border border-blue-100"
            >
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-200">
                <Target size={28} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                To empower students and faculty with a centralized platform that automates the FYP workflow, enhances communication, and ensures transparency and accountability in academic project management.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-indigo-50 p-10 rounded-3xl border border-indigo-100"
            >
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-200">
                <Eye size={28} />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed text-lg">
                To transform how Final Year Projects are managed in academic institutions by creating a digital ecosystem that eliminates manual paperwork and brings excellence to every stage of the project lifecycle.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1700px] mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">The Minds Behind SmartFYP</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Developed by dedicated students under expert guidance at Govt. Graduate College Township, Lahore.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: "Adan Shahid", role: "Team Member", icon: Users, color: "blue" },
              { name: "Fatima", role: "Team Leader", icon: Users, color: "indigo" },
              { name: "Prof. Hina Rahat", role: "Project Supervisor", icon: GraduationCap, color: "purple" },
              { name: "Prof. Mohtashim", role: "Head of Department", icon: Award, color: "blue" }
            ].map((member, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow"
              >
                <div className={`w-20 h-20 bg-${member.color}-100 rounded-full flex items-center justify-center mx-auto mb-6 text-${member.color}-600`}>
                  <member.icon size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                <p className="text-blue-600 font-medium text-sm uppercase tracking-wider">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Context */}
      <section className="py-20 bg-white">
        <div className="max-w-[1700px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMXFYO_84HQ7ciei6tgGoo4gaAFTNfWsdTNA&s" 
                alt="Govt. Graduate College Township Lahore" 
                className="rounded-3xl shadow-2xl w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="md:w-1/2">
              <div className="flex items-center gap-3 mb-6">
                <BookOpen className="text-blue-600" size={32} />
                <h2 className="text-3xl font-bold text-gray-900">Academic Excellence</h2>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed mb-6">
                SmartFYP was conceived as a modular solution to address the real-world challenges faced by students and faculty at <strong>Govt. Graduate College Township, Lahore</strong>. 
              </p>
              <p className="text-gray-600 text-lg leading-relaxed">
                Affiliated with the <strong>University of the Punjab</strong>, our institution strives for technical innovation. This project represents our commitment to digitizing academic workflows and providing students with professional-grade tools for their final year journey.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
