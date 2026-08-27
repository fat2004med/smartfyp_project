import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Brain, 
  Cpu, 
  Search, 
  Activity, 
  Wrench, 
  Award,
  Zap
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Suggested search prompts rotating pool
const ALL_SUGGESTIONS = [
  "Predictive maintenance for industrial factory devices",
  "Post-quantum security cryptography on IoT wearables",
  "Medical anomaly screening from radiology chest X-Rays",
  "Autonomous robot pathfinding using reinforcement learning",
  "Decentralized electronic voting with dual-factor security",
  "Supply chain trace and audit verification system",
  "AI-driven stock portfolio risk profiling tracker",
  "Real-time sign language translator using computer vision",
  "Smart agriculture leaf illness detector and soil telemetry",
  "Automated news summarization and bias scoring portal",
  "IoT water quality monitoring for marine preservation",
  "Intelligent conversational assistant for mental health guidance"
];

const Ideas = () => {
  const [interest, setInterest] = useState('');
  const [domain, setDomain] = useState('');
  const [techStack, setTechStack] = useState('');
  const [limit, setLimit] = useState(6);
  
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState([]);
  const [inferenceTime, setInferenceTime] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);

  const [suggestions, setSuggestions] = useState(ALL_SUGGESTIONS.slice(0, 3));

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 3) % ALL_SUGGESTIONS.length;
      setSuggestions(ALL_SUGGESTIONS.slice(index, index + 3));
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSuggestionClick = (text) => {
    setInterest(text);
  };

  const getRecommendations = async (e) => {
    if (e) e.preventDefault();
    
    if (!interest.trim() && !domain && !techStack.trim()) {
      toast.error('Please enter an interest, select a domain, or suggest technologies.');
      return;
    }

    setLoading(true);
    try {
      const resp = await axios.post('/api/recommendations', {
        query: interest.trim(),
        domain,
        techStack: techStack.trim(),
        limit
      });

      if (resp.data && resp.data.success) {
        setResults(resp.data.data);
        setInferenceTime(resp.data.inferenceTimeMs);
        setModelMetrics(resp.data.metrics);
        setHasSearched(true);
        toast.success(`Generated projects in ${resp.data.inferenceTimeMs}ms!`);
      } else {
        throw new Error('Unsuccessful API response');
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not compute project ideas. Make sure datasets exist.');
    } finally {
      setLoading(false);
    }
  };

  // Run on page load with default general recommendation query
  useEffect(() => {
    const triggerInitial = async () => {
      setLoading(true);
      try {
        const resp = await axios.post('/api/recommendations', {
          query: "machine learning security",
          limit: 6
        });
        if (resp.data?.success) {
          setResults(resp.data.data);
          setInferenceTime(resp.data.inferenceTimeMs);
          setModelMetrics(resp.data.metrics);
        }
      } catch (err) {
        console.warn('Initial recommendations load deferred:', err);
      } finally {
        setLoading(false);
      }
    };
    triggerInitial();
  }, []);

  return (
    <div className="pt-24 pb-20 bg-gray-50/50 min-h-screen">
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.15),transparent)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-bold uppercase mb-6 tracking-wide"
          >
            <Sparkles size={14} className="animate-spin" />
            FYP Ideas Recommendation System
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-6"
          >
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Final Year Project</span>
          </motion.h1>
        </div>
      </section>

      <div className="max-w-5xl md:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 flex flex-col gap-8">
        
        {/* ML Form Panel */}
        <div className="w-full space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/40">
            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2.5 mb-5 border-b border-gray-50 pb-4">
              <Brain className="text-blue-600" size={20} />
              FYP Ideas Recommendations
            </h3>

            <form onSubmit={getRecommendations} className="space-y-4">
              {/* Interest Text Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  My Core Interests / Goals
                </label>
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="e.g., smart energy savings in buildings or secure encryption on low power device"
                    value={interest || ''}
                    onChange={(e) => setInterest(e.target.value)}
                    className="w-full pl-3 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm outline-none transition-all resize-none placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Suggestions Quick Buttons */}
              <div className="pt-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Try these interests:</span>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="text-left text-[11px] font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-gray-100 hover:border-blue-100 transition-all truncate"
                    >
                      &quot;{s}&quot;
                    </button>
                  ))}
                </div>
              </div>

              {/* Preferred Domain selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Preferred Domain Filters
                </label>
                <select
                  value={domain || ''}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 bg-white border border-gray-200 focus:border-blue-500 rounded-xl outline-none transition-all cursor-pointer"
                >
                  <option value="">Any Domain (Auto Detect)</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Cyber Security">Cyber Security</option>
                  <option value="IoT & Robotics">IoT & Robotics</option>
                  <option value="Mobile Applications">Mobile Applications</option>
                  <option value="Full-Stack Web Systems">Full-Stack Web Systems</option>
                </select>
              </div>

              {/* Targeted Tech Stack */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Preferred Technologies / Stack
                </label>
                <input
                  type="text"
                  placeholder="e.g., Python, PyTorch, React, ESP32"
                  value={techStack || ''}
                  onChange={(e) => setTechStack(e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              {/* Recommendations limits slider */}
              <div>
                <label className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  <span>Projects Limit</span>
                  <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-[10px]">{limit} outputs</span>
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  value={limit ?? 6}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:brightness-105 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Cpu className="animate-spin" size={16} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Search size={16} />
                    Generate
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Results Matrix Screen */}
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div className="flex flex-col">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {hasSearched ? 'Project Recommendations' : 'Suggested Academic Projects'}
              </h2>
              <p className="text-xs text-gray-500">
                Sorted by predicted relevance match score calculated using token overlap vectors.
              </p>
            </div>
            
            {hasSearched && (
              <button 
                onClick={() => {
                  setInterest('');
                  setDomain('');
                  setTechStack('');
                  setHasSearched(false);
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl transition-all"
              >
                Reset Search
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <Cpu className="text-blue-600 stroke-1 animate-spin mb-4" size={54} />
              <p className="text-sm font-bold text-gray-700 text-center">prediction</p>
              <p className="text-xs text-gray-400 mt-1">Calculating project relevance</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center px-4">
              <Brain className="text-gray-300 mb-4 stroke-1" size={54} />
              <p className="text-sm font-bold text-gray-700">No project matches found</p>
              <p className="text-xs text-gray-400 max-w-sm mt-1">Try expanding your search query, choosing a different category, or removing technology constraints.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((project, idx) => {
                // Get badge colors based on matchScore
                const isHighMatch = project.matchScore >= 70;
                const scoreColor = isHighMatch 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                  : project.matchScore >= 45 
                  ? 'bg-blue-50 text-blue-600 border-blue-100'
                  : 'bg-gray-100 text-gray-600 border-gray-200';

                return (
                  <motion.div
                    key={project._id || `${project.title || 'proj'}-${idx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                    className="bg-white flex flex-col justify-between p-6 rounded-3xl border border-gray-100 shadow-md shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 hover:border-gray-200 transition-all group duration-300 relative overflow-hidden"
                  >
                    <div>
                      {/* Top Meta info */}
                      <div className="flex items-start justify-between gap-2.5 mb-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 font-bold text-[10px] rounded-full uppercase tracking-wider">
                          {project.domain || 'General'}
                        </span>
                        
                        {/* predicted accuracy confidence indicator */}
                        <div className={`px-2.5 py-1 rounded-xl border font-mono font-extrabold text-[11px] flex items-center gap-1 ${scoreColor}`}>
                          <Award size={12} />
                          {project.matchScore}% score
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-black text-gray-900 mb-2.5 leading-tight group-hover:text-blue-600 transition-colors">
                        {project.title}
                      </h3>

                      {/* Description Description */}
                      <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-4">
                        {project.description}
                      </p>
                    </div>

                    {/* Footer tech stack tags */}
                    <div className="border-t border-gray-50/80 pt-4 mt-auto">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800 mb-2">
                        <Wrench size={12} className="text-gray-400" />
                        <span>Suggested Stack:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.techStack ? (
                          project.techStack.split(',').map((tech, tIdx) => (
                            <span 
                              key={tIdx} 
                              className="px-2 py-0.5 bg-blue-50/80 text-blue-600 font-bold text-[10px] rounded-md"
                            >
                              {tech.trim()}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 font-serif italic">Flexible Stack</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Ideas;
