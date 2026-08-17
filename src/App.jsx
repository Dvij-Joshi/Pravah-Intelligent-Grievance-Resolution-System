import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Search, 
  ListChecks, 
  Workflow, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  BarChart3,
  ArrowRight,
  ChevronRight,
  FileText
} from 'lucide-react';

const FadeIn = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="fixed w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-blue-700" />
              <span className="font-bold text-xl tracking-tight text-slate-900">Pravah</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-700 font-medium transition-colors">Features</a>
              <a href="#workflow" className="text-slate-600 hover:text-blue-700 font-medium transition-colors">Workflow</a>
              <a href="#demo" className="text-slate-600 hover:text-blue-700 font-medium transition-colors">Demo</a>
            </div>
            <div>
              <button className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg font-medium transition-colors shadow-sm">
                Access Portal
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto hero-bg rounded-b-[3rem]">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              Hackathon MVP v1.0
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-8 leading-tight">
              Smart Grievance <span className="text-blue-700">Resolution</span> Automation
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              A multi-agent AI system that takes a citizen grievance from submission to verified resolution, while automatically planning actions, monitoring progress, checking evidence, and detecting recurrence.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-blue-700 hover:bg-blue-800 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors shadow-sm flex items-center justify-center gap-2">
                Experience the MVP <ArrowRight className="h-5 w-5" />
              </button>
              <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors shadow-sm">
                View Documentation
              </button>
            </div>
          </motion.div>
        </div>

        <motion.div 
          className="mt-16 relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8fafc] to-transparent z-10 h-32 bottom-0 top-auto"></div>
          <img 
            src="https://via.placeholder.com/1200x675?text=hero-dashboard.png" 
            alt="Pravah Dashboard Mockup" 
            className="rounded-2xl shadow-2xl border border-slate-200 object-cover w-full h-auto"
          />
        </motion.div>
      </section>

      {/* Core Philosophy Section */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Not Just Another Chatbot</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We are building the intelligent resolution layer after a grievance enters the system, completely automating the seven stages of governance.
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Search, title: "Understand", desc: "AI converts messy human language into structured data." },
            { icon: ListChecks, title: "Plan", desc: "Creates the required resolution workflow & assigns SLA." },
            { icon: Clock, title: "Monitor", desc: "System watches deadlines, dependencies and actions." },
            { icon: AlertTriangle, title: "Intervene", desc: "Automatically reminds and escalates when stuck." },
            { icon: CheckCircle2, title: "Verify", desc: "AI checks photographic evidence before closure." },
            { icon: BarChart3, title: "Learn", desc: "Detects recurring problems for systemic alerts." }
          ].map((feature, idx) => (
            <FadeIn key={idx} delay={idx * 0.1}>
              <div className="card-panel p-6 h-full flex flex-col items-start text-left">
                <div className="p-3 bg-blue-50 text-blue-700 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600 flex-grow">{feature.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* The Multi-Agent System */}
      <section className="py-24 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2">
              <FadeIn>
                <h2 className="text-3xl font-bold text-slate-900 mb-6">The Multi-Agent System</h2>
                <p className="text-lg text-slate-600 mb-8">
                  Four specialized AI agents working together with deterministic backend rules to ensure every citizen grievance is handled properly.
                </p>
                <div className="space-y-6">
                  {[
                    { agent: "Triage Agent", model: "GPT-OSS 120B", job: "Understands & structures unstructured grievance data." },
                    { agent: "Resolution Planner", model: "GPT-OSS 120B", job: "Generates step-by-step action workflows." },
                    { agent: "Evidence Agent", model: "Qwen 3.6 27B", job: "Analyzes before/after visual evidence." },
                    { agent: "Resolution Agent", model: "GPT-OSS 120B", job: "Reviews all evidence to recommend closure." }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="mt-1 bg-blue-100 text-blue-700 rounded-full p-1">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 flex items-center gap-2">
                          {item.agent} 
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">{item.model}</span>
                        </h4>
                        <p className="text-slate-600 mt-1">{item.job}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
            <div className="lg:w-1/2 w-full">
              <FadeIn delay={0.2}>
                <img 
                  src="https://via.placeholder.com/800x600?text=agent-workflow.png" 
                  alt="Agent Workflow Diagram" 
                  className="rounded-xl shadow-lg border border-slate-200 w-full"
                />
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Walkthrough */}
      <section id="demo" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <FadeIn>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">1-Click Demo: The Pothole Lifecycle</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Watch how our system intelligently carries a single complaint all the way to verified resolution and systemic insight.
            </p>
          </div>
        </FadeIn>

        <div className="space-y-12">
          {/* Step 1 & 2 */}
          <div className="flex flex-col md:flex-row gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="md:w-1/2">
              <div className="text-sm font-bold text-blue-700 mb-2 tracking-wide uppercase">Step 1: The Incident</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Citizen Submits Grievance</h3>
              <p className="text-slate-600 mb-4 italic">"There's a huge pothole outside the government school in Ward 5."</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 font-mono text-sm text-slate-700">
                <span className="text-green-600">Triage Agent Output:</span><br/>
                &#123;<br/>
                &nbsp;&nbsp;"category": "Road Infrastructure",<br/>
                &nbsp;&nbsp;"location": "Ward 5",<br/>
                &nbsp;&nbsp;"priority": "HIGH"<br/>
                &#125;
              </div>
            </div>
            <div className="md:w-1/2">
              <img src="https://via.placeholder.com/600x400?text=evidence-before.png" alt="Before Pothole" className="rounded-xl shadow-md w-full" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row-reverse gap-8 items-center bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="md:w-1/2">
              <div className="text-sm font-bold text-blue-700 mb-2 tracking-wide uppercase">Step 2: The Repair</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">AI Verification</h3>
              <p className="text-slate-600 mb-4">After the workflow triggers the repair, the officer uploads completion evidence. The Evidence Agent analyzes the images.</p>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 font-mono text-sm text-slate-700">
                <span className="text-green-600">Evidence Agent Output:</span><br/>
                &#123;<br/>
                &nbsp;&nbsp;"confidence": 0.91,<br/>
                &nbsp;&nbsp;"change_detected": true,<br/>
                &nbsp;&nbsp;"visual_consistency": true<br/>
                &#125;
              </div>
            </div>
            <div className="md:w-1/2">
              <img src="https://via.placeholder.com/600x400?text=evidence-after.png" alt="After Repair" className="rounded-xl shadow-md w-full" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-blue-900 text-white p-10 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
              <Workflow className="w-64 h-64" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <div className="text-sm font-bold text-blue-300 mb-2 tracking-wide uppercase">Step 3: Proactive Governance</div>
              <h3 className="text-2xl font-bold mb-4">Systemic Alert Detected</h3>
              <p className="text-blue-100 text-lg mb-6">
                Later, the Recurrence Agent detects 12 similar pothole complaints around Ward 5. It flags a potential infrastructure problem to the dashboard.
              </p>
              <div className="bg-white/10 backdrop-blur border border-white/20 p-5 rounded-lg inline-block">
                <p className="font-medium italic">
                  "We didn't just close one complaint. We used its entire lifecycle to prevent the next ten."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-blue-500" />
            <span className="font-bold text-xl text-white">Pravah</span>
          </div>
          <p className="mb-6 max-w-md mx-auto">
            Internal Hackathon MVP • Smart Grievance Resolution Automation
          </p>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} Pravah Team. Built for the Hackathon.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
