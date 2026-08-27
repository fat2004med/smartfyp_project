import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;
    
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Sending your message...');
    try {
      const response = await axios.post('/api/contact', {
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim()
      });

      if (response.data && response.data.success) {
        setIsSuccess(true);
        toast.success(response.data.message || 'Message sent successfully!', { id: toastId });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (err) {
      console.error('Contact submission error:', err);
      const errMsg = err.response?.data?.message || 'Could not deliver your message. Please try again.';
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      subject: 'General Inquiry',
      message: ''
    });
    setIsSuccess(false);
  };

  return (
    <div className="pt-24 pb-16">
      {/* Header */}
      <section className="bg-gray-900 py-20 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>
        <div className="max-w-[1700px] mx-auto px-4 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold mb-6"
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400 text-xl max-w-2xl mx-auto"
          >
            Have questions about SmartFYP? Our team is here to help you streamline your academic project journey.
          </motion.p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-[1700px] mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-blue-50 p-8 rounded-3xl border border-blue-100"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-6">
                  <MapPin size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Our Location</h3>
                <p className="text-gray-600">Govt. Graduate College Township, College Road, Lahore.</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100"
              >
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white mb-6">
                  <Phone size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Phone Number</h3>
                <p className="text-gray-600">(042) 99262112</p>
                <p className="text-sm text-gray-500 mt-2">Mon - Fri, 8:00 AM - 4:00 PM</p>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-purple-50 p-8 rounded-3xl border border-purple-100"
              >
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center text-white mb-6">
                  <Mail size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Email Address</h3>
                <p className="text-gray-600">gcbtownship@gmail.com</p>
                <p className="text-sm text-gray-500 mt-2">We usually reply within 24 hours.</p>
              </motion.div>
            </div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100"
            >
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center text-center py-12"
                >
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm animate-bounce">
                    <CheckCircle2 size={44} />
                  </div>
                  <h2 className="text-3xl font-black text-gray-900 mb-3 flex items-center gap-2 justify-center">
                    Message Sent! <Sparkles className="text-amber-500" size={24} />
                  </h2>
                  <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
                    Thank you for reaching out to us. Your inquiry has been received by system administrators and logged successfully. We normally review and reply within 24 hours!
                  </p>
                  <button 
                    onClick={handleReset}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                  >
                    Send Another Message
                  </button>
                </motion.div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <MessageSquare className="text-blue-600" size={28} />
                    <h2 className="text-3xl font-bold text-gray-900">Send us a Message</h2>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          required
                          value={formData.email || ''}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="john@example.com"
                          disabled={isSubmitting}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                      <select 
                        value={formData.subject || 'General Inquiry'}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all appearance-none bg-white disabled:bg-gray-50 disabled:text-gray-400"
                      >
                        <option>General Inquiry</option>
                        <option>Technical Support</option>
                        <option>Project Submission Issue</option>
                        <option>Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Message</label>
                      <textarea 
                        rows="5" 
                        required
                        value={formData.message || ''}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="How can we help you?"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none disabled:bg-gray-50 disabled:text-gray-400"
                      ></textarea>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group disabled:bg-blue-400 disabled:shadow-none"
                    >
                      {isSubmitting ? 'Sending Message...' : 'Send Message'}
                      {!isSubmitting && <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ / Help Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1700px] mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Common Questions</h2>
            <p className="text-gray-600">Quick answers to frequently asked questions.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">How do I reset my password?</h4>
              <p className="text-gray-600 text-sm">On your first login, the system will automatically prompt you to set a new password. If you forget it later, please contact your department HOD.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="font-bold text-gray-900 mb-2">Can I change my project team?</h4>
              <p className="text-gray-600 text-sm">Team assignments are managed by the HOD. Any changes to the group structure must be approved and updated by the department head.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
