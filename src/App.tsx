import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Briefcase, 
  Wand2, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Loader2,
  Sparkles,
  Target,
  Upload,
  FileUp
} from 'lucide-react';
import Markdown from 'react-markdown';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { optimizeResume, OptimizationResult } from './services/geminiService';

// Set worker source for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
import { generateWordDoc, generatePdf } from './services/docService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [generateCoverLetter, setGenerateCoverLetter] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isDocx = file.name.endsWith('.docx');
    const isPdf = file.name.endsWith('.pdf');

    if (!isDocx && !isPdf) {
      setError('Please upload a .docx or .pdf file.');
      return;
    }

    setIsExtracting(true);
    setError(null);
    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';

      if (isDocx) {
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (isPdf) {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => (item as any).str);
          fullText += strings.join(' ') + '\n';
        }
        text = fullText;
      }

      setResume(text);
      setUploadedFileName(file.name);
    } catch (err) {
      console.error(err);
      setError(`Failed to extract text from the ${isDocx ? 'Word' : 'PDF'} document.`);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleOptimize = async () => {
    if (!resume || !jobDescription) {
      setError('Please provide both your resume and the job description.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await optimizeResume(resume, jobDescription, companyName, generateCoverLetter);
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('Failed to optimize resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getFileName = (extension: string) => {
    const base = companyName ? `${companyName.replace(/\s+/g, '_')}_Resume` : 'Optimized_Resume';
    return `${base}.${extension}`;
  };

  const handleDownloadWord = async () => {
    if (result) {
      await generateWordDoc(result.optimizedResume, result.coverLetter, getFileName('docx'));
    }
  };

  const handleDownloadPdf = async () => {
    if (result) {
      await generatePdf(result.optimizedResume, result.coverLetter, getFileName('pdf'));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans selection:bg-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">ResumeOptimizer<span className="text-indigo-600">Pro</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Templates</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">Optimize your resume</h2>
              <p className="text-gray-500">Upload your Word resume or paste the text below.</p>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google"
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={generateCoverLetter}
                        onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-6 rounded-full transition-colors",
                        generateCoverLetter ? "bg-indigo-600" : "bg-gray-200"
                      )} />
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                        generateCoverLetter ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors">Generate Cover Letter</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Your Current Resume
                  </label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    Upload .docx / .pdf
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".docx,.pdf" 
                    className="hidden" 
                  />
                </div>
                
                <div className="relative">
                  {uploadedFileName ? (
                    <div className="w-full h-48 p-6 bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-xl flex flex-col items-center justify-center gap-4 group transition-all">
                      <div className="bg-white p-3 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900">{uploadedFileName}</p>
                        <p className="text-xs text-gray-500 mt-1">Text extracted successfully</p>
                      </div>
                      <button 
                        onClick={() => {
                          setUploadedFileName(null);
                          setResume('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700 underline underline-offset-4"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      placeholder="Paste your resume text here or upload a .docx/.pdf file..."
                      className="w-full h-48 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-sm"
                    />
                  )}
                  {isExtracting && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                      <span className="text-sm font-bold text-gray-600">Extracting text...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Briefcase className="w-4 h-4 text-indigo-600" />
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-48 p-4 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-sm"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-700 text-sm"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleOptimize}
                disabled={loading || isExtracting}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200",
                  (loading || isExtracting) ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Optimizing with AI...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Optimize Resume {generateCoverLetter && "& Cover Letter"}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {!result && !loading && (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-12 text-center space-y-4"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Target className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Awaiting Input</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Fill in your details on the left to see your AI-optimized resume and ATS score.</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] bg-white border border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center space-y-8"
                >
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-gray-900">Analyzing & Rewriting</h3>
                    <p className="text-gray-500">Our AI is matching your skills with the job requirements...</p>
                  </div>
                  <div className="w-full max-w-xs space-y-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-indigo-600"
                        animate={{ width: ["0%", "40%", "70%", "95%"] }}
                        transition={{ duration: 10, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-gray-400">
                      <span>Scanning JD</span>
                      <span>Rewriting</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="relative w-20 h-20">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-gray-100"
                            strokeDasharray="100, 100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-emerald-500"
                            initial={{ strokeDasharray: "0, 100" }}
                            animate={{ strokeDasharray: `${result.atsScore}, 100` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            strokeWidth="3"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                          <span className="text-xl font-bold text-gray-900">{result.atsScore}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">ATS Match Score</h4>
                        <p className="text-sm text-gray-500">Your resume is highly relevant!</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleDownloadWord}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download .docx
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        className="bg-white border border-gray-900 text-gray-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 text-sm"
                      >
                        <FileUp className="w-4 h-4" />
                        Download .pdf
                      </button>
                    </div>
                  </div>

                  {/* Analysis Tabs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
                        <CheckCircle2 className="w-4 h-4" />
                        Keywords Found
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsFound.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-white text-emerald-600 text-xs font-medium rounded-md border border-emerald-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-amber-700 font-bold text-sm mb-3">
                        <AlertCircle className="w-4 h-4" />
                        Missing Keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsMissing.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-white text-amber-600 text-xs font-medium rounded-md border border-amber-200">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
                    <h4 className="text-indigo-900 font-bold mb-4 flex items-center gap-2">
                      <ChevronRight className="w-4 h-4" />
                      AI Recommendations
                    </h4>
                    <ul className="space-y-3">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-indigo-800">
                          <span className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview */}
                  <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Optimized Preview</span>
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
                      </div>
                    </div>
                    <div className="p-8 max-h-[500px] overflow-y-auto prose prose-sm prose-indigo max-w-none">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4">Resume</h3>
                      <Markdown>{result.optimizedResume}</Markdown>
                      {result.coverLetter && (
                        <>
                          <h3 className="text-lg font-bold text-gray-900 border-b pb-2 mb-4 mt-12">Cover Letter</h3>
                          <Markdown>{result.coverLetter}</Markdown>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2026 ResumeOptimizer Pro. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}
