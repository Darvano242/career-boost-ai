import React, { useState, useRef } from 'react';
import { Upload, Zap, CheckCircle, Star, TrendingUp, FileText, Sparkles, ArrowRight, DollarSign, Crown, MessageSquare, Video, Brain, Target, Award, Users } from 'lucide-react';

const CareerBoostAI = () => {
  const [step, setStep] = useState('landing'); // landing, product-select, resume-upload, resume-analyzing, resume-results, interview-setup, interview-session, interview-results
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [optimizedResume, setOptimizedResume] = useState('');
  const [interviewDetails, setInterviewDetails] = useState({ jobTitle: '', company: '', industry: '' });
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [interviewFeedback, setInterviewFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setStep('resume-analyzing');
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      setResumeText(text);
      await analyzeResume(text);
    };
    reader.readAsText(uploadedFile);
  };

  const analyzeResume = async (text) => {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Analyze this resume and provide a JSON response with these exact fields:
            - atsScore (number 0-100)
            - keyIssues (array of 3-5 strings)
            - strengths (array of 2-3 strings)
            - missingKeywords (array of 5-8 relevant keywords)
            - improvementAreas (array of 3-4 strings)
            
            Resume: ${text}
            
            Respond ONLY with valid JSON, no markdown, no preamble.`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text.replace(/```json|```/g, '').trim();
      const analysisData = JSON.parse(content);
      
      setAnalysis(analysisData);
      setLoading(false);
      setStep('resume-results');
    } catch (error) {
      console.error('Analysis error:', error);
      setLoading(false);
    }
  };

  const generateOptimizedResume = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Optimize this resume for ATS systems. Add relevant keywords: ${analysis.missingKeywords.join(', ')}. Address these issues: ${analysis.keyIssues.join(', ')}. Keep the same experience but make it more impactful.

Original Resume: ${resumeText}

Provide the optimized resume in plain text format, ready to copy.`
          }]
        })
      });

      const data = await response.json();
      const optimized = data.content[0].text;
      setOptimizedResume(optimized);
      setLoading(false);
    } catch (error) {
      console.error('Optimization error:', error);
      setLoading(false);
    }
  };

  const generateInterviewQuestions = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Generate 8 realistic interview questions for a ${interviewDetails.jobTitle} position at ${interviewDetails.company} in the ${interviewDetails.industry} industry. 

Include a mix of:
- 2 behavioral questions
- 2 technical/role-specific questions
- 2 situational questions
- 2 company culture fit questions

Return ONLY a JSON array of objects with format: [{"question": "...", "type": "behavioral"}, ...]

No markdown, no preamble.`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text.replace(/```json|```/g, '').trim();
      const questions = JSON.parse(content);
      
      setInterviewQuestions(questions);
      setLoading(false);
      setStep('interview-session');
    } catch (error) {
      console.error('Question generation error:', error);
      setLoading(false);
    }
  };

  const submitAnswer = async (answer) => {
    const newAnswers = [...userAnswers, { question: interviewQuestions[currentQuestion].question, answer }];
    setUserAnswers(newAnswers);

    if (currentQuestion < interviewQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      await generateFeedback(newAnswers);
    }
  };

  const generateFeedback = async (answers) => {
    setLoading(true);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Evaluate these interview answers for a ${interviewDetails.jobTitle} position. For each answer, provide specific feedback.

${answers.map((a, i) => `Q${i+1}: ${a.question}\nAnswer: ${a.answer}`).join('\n\n')}

Return JSON with format:
{
  "overallScore": 75,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "answerFeedback": [
    {"score": 8, "feedback": "Good answer because...", "betterAnswer": "You could improve by..."}
  ]
}

No markdown, no preamble.`
          }]
        })
      });

      const data = await response.json();
      const content = data.content[0].text.replace(/```json|```/g, '').trim();
      const feedback = JSON.parse(content);
      
      setInterviewFeedback(feedback);
      setLoading(false);
      setStep('interview-results');
    } catch (error) {
      console.error('Feedback generation error:', error);
      setLoading(false);
    }
  };

  const handlePayment = (product) => {
    alert(`🎉 Payment successful for ${product}!\n\nIn production, this integrates with Stripe.`);
    
    if (product === 'resume') {
      generateOptimizedResume();
    } else if (product === 'interview') {
      generateInterviewQuestions();
    } else if (product === 'bundle') {
      generateOptimizedResume();
      setStep('interview-setup');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Manrope:wght@400;500;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Manrope', sans-serif;
          overflow-x: hidden;
        }
        
        .heading-font {
          font-family: 'Playfair Display', serif;
          font-weight: 900;
        }
        
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .card-luxury {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }
        
        .card-luxury:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(102, 126, 234, 0.5);
          transform: translateY(-5px);
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        
        .btn-primary:hover {
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
          transform: translateY(-2px);
        }
        
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(5deg); }
        }
        
        .float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        .shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.3;
          pointer-events: none;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: #667eea;
          top: -200px;
          right: -200px;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: #764ba2;
          bottom: -150px;
          left: -150px;
        }

        .orb-3 {
          width: 300px;
          height: 300px;
          background: #f093fb;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      `}</style>

      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>

      {/* Landing Page */}
      {step === 'landing' && (
        <div className="relative min-h-screen">
          {/* Header */}
          <header className="container mx-auto px-6 py-8 flex justify-between items-center relative z-10">
            <div className="heading-font text-4xl gradient-text">CareerBoost AI</div>
            <button 
              onClick={() => setStep('product-select')}
              className="btn-primary px-8 py-3 rounded-full font-bold"
            >
              Get Started →
            </button>
          </header>

          {/* Hero */}
          <div className="container mx-auto px-6 py-20 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm mb-8">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-semibold">Powered by Advanced AI • Trusted by 10,000+ Job Seekers</span>
              </div>
              
              <h1 className="heading-font text-6xl md:text-8xl mb-6 leading-tight">
                Land Your Dream Job<br/>
                <span className="gradient-text">10x Faster</span>
              </h1>
              
              <p className="text-xl md:text-2xl mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed">
                AI-powered resume optimization and interview coaching that gets you past ATS systems and impresses hiring managers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
                <button 
                  onClick={() => setStep('product-select')}
                  className="btn-primary px-12 py-5 rounded-full text-lg font-bold"
                >
                  Start Free Analysis
                </button>
                <button className="px-12 py-5 rounded-full text-lg font-bold border-2 border-white/30 hover:bg-white/10 transition-all">
                  View Success Stories
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-4xl mx-auto">
                <div className="text-center">
                  <div className="heading-font text-5xl gradient-text mb-2">98%</div>
                  <div className="text-sm text-gray-400">ATS Pass Rate</div>
                </div>
                <div className="text-center">
                  <div className="heading-font text-5xl gradient-text mb-2">4.2X</div>
                  <div className="text-sm text-gray-400">More Interviews</div>
                </div>
                <div className="text-center">
                  <div className="heading-font text-5xl gradient-text mb-2">72H</div>
                  <div className="text-sm text-gray-400">Avg. Time to Offer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Preview Cards */}
          <div className="container mx-auto px-6 pb-20 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="card-luxury rounded-3xl p-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6 float-slow">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="heading-font text-3xl mb-4">Resume Optimizer</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">AI analyzes and rewrites your resume to beat ATS systems and land more interviews.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>ATS compatibility score</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Keyword optimization</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Professional rewrite</span>
                  </li>
                </ul>
                <div className="heading-font text-4xl gradient-text mb-2">$20</div>
                <div className="text-sm text-gray-400">One-time payment</div>
              </div>

              <div className="card-luxury rounded-3xl p-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 float-slow" style={{ animationDelay: '1s' }}>
                  <Brain className="w-8 h-8" />
                </div>
                <h3 className="heading-font text-3xl mb-4">Interview Coach</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">Practice with AI-generated questions and get personalized feedback on your answers.</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Role-specific questions</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>AI feedback & scoring</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>Unlimited practice sessions</span>
                  </li>
                </ul>
                <div className="heading-font text-4xl gradient-text mb-2">$20</div>
                <div className="text-sm text-gray-400">Per interview prep</div>
              </div>
            </div>
          </div>

          {/* Bundle Offer */}
          <div className="container mx-auto px-6 pb-20 relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="card-luxury rounded-3xl p-12 text-center relative overflow-hidden">
                <div className="shimmer absolute inset-0"></div>
                <div className="relative z-10">
                  <Crown className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <div className="inline-block px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300 text-sm font-bold mb-4">
                    SAVE $10 • BEST VALUE
                  </div>
                  <h2 className="heading-font text-5xl mb-4">Complete Career Bundle</h2>
                  <p className="text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">Get both Resume Optimizer + Interview Coach together and maximize your chances of landing the job.</p>
                  
                  <div className="flex items-center justify-center gap-4 mb-8">
                    <div className="text-3xl text-gray-500 line-through">$40</div>
                    <div className="heading-font text-7xl gradient-text">$30</div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedProduct('bundle');
                      setStep('product-select');
                    }}
                    className="btn-primary px-16 py-6 rounded-full text-xl font-bold inline-flex items-center gap-3"
                  >
                    Get Complete Bundle
                    <ArrowRight className="w-6 h-6" />
                  </button>

                  <div className="mt-8 text-sm text-gray-400">
                    ✓ Lifetime access • ✓ Instant delivery • ✓ 100% satisfaction guaranteed
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Selection */}
      {step === 'product-select' && (
        <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
          <div className="max-w-5xl w-full">
            <button 
              onClick={() => setStep('landing')}
              className="mb-8 text-purple-300 hover:text-purple-200 flex items-center gap-2"
            >
              ← Back
            </button>

            <h2 className="heading-font text-5xl mb-4 text-center">Choose Your Path</h2>
            <p className="text-center text-gray-400 mb-12 text-lg">Select the service that fits your needs</p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Resume Only */}
              <div className="card-luxury rounded-3xl p-8 cursor-pointer" onClick={() => {
                setSelectedProduct('resume');
                setStep('resume-upload');
              }}>
                <FileText className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="heading-font text-2xl mb-2">Resume Only</h3>
                <div className="heading-font text-4xl gradient-text mb-4">$20</div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    ATS Score Analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Optimized Resume
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Instant Download
                  </li>
                </ul>
              </div>

              {/* Interview Only */}
              <div className="card-luxury rounded-3xl p-8 cursor-pointer" onClick={() => {
                setSelectedProduct('interview');
                setStep('interview-setup');
              }}>
                <Brain className="w-12 h-12 text-purple-400 mb-4" />
                <h3 className="heading-font text-2xl mb-2">Interview Only</h3>
                <div className="heading-font text-4xl gradient-text mb-4">$20</div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    8 Custom Questions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    AI Feedback
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Detailed Scoring
                  </li>
                </ul>
              </div>

              {/* Bundle */}
              <div className="card-luxury rounded-3xl p-8 cursor-pointer border-2 border-yellow-500/50" onClick={() => {
                setSelectedProduct('bundle');
                setStep('resume-upload');
              }}>
                <div className="flex items-center justify-between mb-4">
                  <Crown className="w-12 h-12 text-yellow-400" />
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-bold rounded-full">SAVE $10</span>
                </div>
                <h3 className="heading-font text-2xl mb-2">Complete Bundle</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl text-gray-500 line-through">$40</span>
                  <div className="heading-font text-4xl gradient-text">$30</div>
                </div>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Everything in Resume
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Everything in Interview
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Best Value Package
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resume Upload */}
      {step === 'resume-upload' && (
        <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
          <div className="max-w-2xl w-full">
            <button 
              onClick={() => setStep('product-select')}
              className="mb-8 text-purple-300 hover:text-purple-200 flex items-center gap-2"
            >
              ← Back
            </button>
            
            <div className="card-luxury rounded-3xl p-12 text-center">
              <Upload className="w-20 h-20 text-purple-400 mx-auto mb-6 float-slow" />
              <h2 className="heading-font text-4xl mb-4">Upload Your Resume</h2>
              <p className="text-gray-400 mb-8">Supports .txt, .doc, .docx, .pdf formats</p>
              
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.doc,.docx,.pdf"
                className="hidden"
              />
              
              <button 
                onClick={() => fileInputRef.current.click()}
                className="btn-primary px-12 py-5 rounded-full text-xl font-bold w-full"
              >
                Choose File
              </button>
              
              <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Secure Upload
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  60s Analysis
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Privacy Protected
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analyzing */}
      {step === 'resume-analyzing' && (
        <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
          <div className="text-center">
            <div className="w-32 h-32 border-8 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
            <h2 className="heading-font text-5xl mb-4 gradient-text">Analyzing Resume</h2>
            <p className="text-gray-400 text-xl">AI is evaluating ATS compatibility...</p>
          </div>
        </div>
      )}

      {/* Resume Results */}
      {step === 'resume-results' && analysis && (
        <div className="min-h-screen py-20 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="heading-font text-6xl mb-4">Your Resume Score</h2>
              <div className="heading-font text-9xl gradient-text mb-2">{analysis.atsScore}<span className="text-5xl">/100</span></div>
              <p className="text-xl text-gray-400">ATS Compatibility Rating</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Issues */}
              <div className="card-luxury rounded-3xl p-8">
                <h3 className="heading-font text-3xl mb-6 text-red-400">Critical Issues</h3>
                <ul className="space-y-3">
                  {analysis.keyIssues.map((issue, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Strengths */}
              <div className="card-luxury rounded-3xl p-8">
                <h3 className="heading-font text-3xl mb-6 text-green-400">Your Strengths</h3>
                <ul className="space-y-3">
                  {analysis.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Missing Keywords */}
            <div className="card-luxury rounded-3xl p-8 mb-12">
              <h3 className="heading-font text-3xl mb-6 text-yellow-400">Missing Keywords</h3>
              <div className="flex flex-wrap gap-3">
                {analysis.missingKeywords.map((keyword, i) => (
                  <span key={i} className="px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-300 font-semibold text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {/* Payment CTA */}
            <div className="card-luxury rounded-3xl p-12 text-center border-2 border-purple-500/50">
              <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h3 className="heading-font text-4xl mb-4">Get Your Optimized Resume</h3>
              <p className="text-gray-300 mb-8 text-lg">AI will rewrite your resume to fix all issues and boost your ATS score to 95+</p>
              <div className="heading-font text-7xl gradient-text mb-8">${selectedProduct === 'bundle' ? '30' : '20'}</div>
              <button 
                onClick={() => handlePayment('resume')}
                className="btn-primary px-16 py-6 rounded-full text-xl font-bold inline-flex items-center gap-3 mb-4"
              >
                Unlock Optimized Resume
                <ArrowRight className="w-6 h-6" />
              </button>
              
              {selectedProduct !== 'bundle' && (
                <div className="mt-6">
                  <p className="text-sm text-gray-400 mb-3">Want interview coaching too?</p>
                  <button 
                    onClick={() => {
                      setSelectedProduct('bundle');
                      handlePayment('bundle');
                    }}
                    className="px-8 py-3 rounded-full border-2 border-yellow-500/50 text-yellow-300 font-bold hover:bg-yellow-500/10 transition-all"
                  >
                    Upgrade to Bundle - Add Interview Coaching for Just $10!
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interview Setup */}
      {step === 'interview-setup' && (
        <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
          <div className="max-w-2xl w-full">
            <div className="card-luxury rounded-3xl p-12">
              <Brain className="w-16 h-16 text-purple-400 mb-6 float-slow" />
              <h2 className="heading-font text-4xl mb-8">Interview Prep Setup</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Job Title</label>
                  <input 
                    type="text"
                    placeholder="e.g., Senior Software Engineer"
                    value={interviewDetails.jobTitle}
                    onChange={(e) => setInterviewDetails({...interviewDetails, jobTitle: e.target.value})}
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Company Name</label>
                  <input 
                    type="text"
                    placeholder="e.g., Google, Microsoft, Startup Inc"
                    value={interviewDetails.company}
                    onChange={(e) => setInterviewDetails({...interviewDetails, company: e.target.value})}
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Industry</label>
                  <input 
                    type="text"
                    placeholder="e.g., Technology, Healthcare, Finance"
                    value={interviewDetails.industry}
                    onChange={(e) => setInterviewDetails({...interviewDetails, industry: e.target.value})}
                    className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={() => {
                  if (selectedProduct === 'interview') {
                    // Show payment for interview only
                    handlePayment('interview');
                  } else {
                    // Bundle already paid, generate questions
                    generateInterviewQuestions();
                  }
                }}
                disabled={!interviewDetails.jobTitle || !interviewDetails.company || !interviewDetails.industry}
                className="btn-primary w-full px-12 py-5 rounded-full text-xl font-bold mt-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedProduct === 'interview' ? 'Pay $20 & Start Practice' : 'Start Interview Practice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interview Session */}
      {step === 'interview-session' && interviewQuestions.length > 0 && (
        <div className="min-h-screen flex items-center justify-center px-6 relative z-10">
          <div className="max-w-3xl w-full">
            <div className="mb-6 flex items-center justify-between text-sm">
              <span className="text-gray-400">Question {currentQuestion + 1} of {interviewQuestions.length}</span>
              <span className="text-purple-400 font-semibold">{interviewQuestions[currentQuestion].type}</span>
            </div>

            <div className="card-luxury rounded-3xl p-12">
              <MessageSquare className="w-12 h-12 text-purple-400 mb-6" />
              <h3 className="heading-font text-3xl mb-8">{interviewQuestions[currentQuestion].question}</h3>
              
              <textarea
                placeholder="Type your answer here... Take your time and be specific."
                className="w-full h-48 px-6 py-4 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none transition-all resize-none mb-6"
                id="answer-input"
              />

              <button 
                onClick={() => {
                  const answer = document.getElementById('answer-input').value;
                  if (answer.trim()) {
                    submitAnswer(answer);
                    document.getElementById('answer-input').value = '';
                  }
                }}
                className="btn-primary w-full px-12 py-5 rounded-full text-xl font-bold"
              >
                {currentQuestion < interviewQuestions.length - 1 ? 'Next Question' : 'Submit & Get Feedback'}
              </button>
            </div>

            <div className="mt-6 flex gap-2 justify-center">
              {interviewQuestions.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-3 h-3 rounded-full ${i < currentQuestion ? 'bg-green-400' : i === currentQuestion ? 'bg-purple-500' : 'bg-gray-600'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interview Results */}
      {step === 'interview-results' && interviewFeedback && (
        <div className="min-h-screen py-20 px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <Award className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
              <h2 className="heading-font text-6xl mb-4">Interview Performance</h2>
              <div className="heading-font text-9xl gradient-text mb-2">{interviewFeedback.overallScore}<span className="text-5xl">/100</span></div>
              <p className="text-xl text-gray-400">Overall Interview Score</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Strengths */}
              <div className="card-luxury rounded-3xl p-8">
                <h3 className="heading-font text-3xl mb-6 text-green-400">What Went Well</h3>
                <ul className="space-y-3">
                  {interviewFeedback.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <Star className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Improvements */}
              <div className="card-luxury rounded-3xl p-8">
                <h3 className="heading-font text-3xl mb-6 text-yellow-400">Areas to Improve</h3>
                <ul className="space-y-3">
                  {interviewFeedback.improvements.map((improvement, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-300">
                      <Target className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Detailed Feedback */}
            <div className="space-y-6">
              {interviewFeedback.answerFeedback.map((feedback, i) => (
                <div key={i} className="card-luxury rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="heading-font text-xl">Question {i + 1}</h4>
                    <span className="px-4 py-2 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                      {feedback.score}/10
                    </span>
                  </div>
                  <p className="text-gray-400 mb-4 italic">"{userAnswers[i].question}"</p>
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-gray-400 block mb-2">Your Answer:</span>
                    <p className="text-gray-300">{userAnswers[i].answer}</p>
                  </div>
                  <div className="mb-4">
                    <span className="text-sm font-semibold text-green-400 block mb-2">Feedback:</span>
                    <p className="text-gray-300">{feedback.feedback}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-yellow-400 block mb-2">How to Improve:</span>
                    <p className="text-gray-300">{feedback.betterAnswer}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Practice Again */}
            <div className="mt-12 text-center">
              <button 
                onClick={() => {
                  setCurrentQuestion(0);
                  setUserAnswers([]);
                  setInterviewFeedback(null);
                  setStep('interview-setup');
                }}
                className="btn-primary px-12 py-5 rounded-full text-xl font-bold"
              >
                Practice Another Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && step !== 'resume-analyzing' && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-20 h-20 border-8 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-300">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerBoostAI;