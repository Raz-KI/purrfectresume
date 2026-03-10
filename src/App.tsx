import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cat,
  PawPrint,
  Heart,
  Fish,
  Smile,
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
    <div className="min-h-screen bg-[#FFFBF0] text-[#2D241E] font-sans selection:bg-orange-100">
      {/* Header */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-2 rounded-xl rotate-3 shadow-md">
              <Cat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-gray-900">Purrfect<span className="text-orange-500">Resume</span></h1>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-bold text-gray-500">
            <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1"><PawPrint className="w-4 h-4" /> How it works</a>
            <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1"><Fish className="w-4 h-4" /> Templates</a>
            <a href="#" className="hover:text-orange-500 transition-colors flex items-center gap-1"><Heart className="w-4 h-4" /> Pricing</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Input Section */}
          <div className="space-y-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-500 font-bold text-sm uppercase tracking-widest">
                <Smile className="w-4 h-4" /> Meow-lo there!
              </div>
              <h2 className="text-4xl font-black text-gray-900 leading-tight">Make your resume <span className="text-orange-500 underline decoration-wavy decoration-orange-200">purr-fect</span></h2>
              <p className="text-gray-600 text-lg">Our feline-powered AI will help you land that dream role. No kitten!</p>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-400" />
                    Company Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Catnip Corp"
                    className="w-full p-3 bg-white border-2 border-orange-50 rounded-2xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all shadow-sm outline-none"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer group bg-white p-3 rounded-2xl border-2 border-orange-50 shadow-sm hover:border-orange-200 transition-all">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={generateCoverLetter}
                        onChange={(e) => setGenerateCoverLetter(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-6 rounded-full transition-colors",
                        generateCoverLetter ? "bg-orange-500" : "bg-gray-200"
                      )} />
                      <div className={cn(
                        "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow-sm",
                        generateCoverLetter ? "translate-x-4" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-gray-700 group-hover:text-orange-600 transition-colors">Tailored Cover Letter</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Your Current Resume
                  </label>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-black text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors bg-orange-50 px-3 py-1.5 rounded-full"
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
                    <div className="w-full h-48 p-6 bg-orange-50 border-2 border-dashed border-orange-200 rounded-3xl flex flex-col items-center justify-center gap-4 group transition-all">
                      <div className="bg-white p-4 rounded-full shadow-md group-hover:rotate-12 transition-transform">
                        <PawPrint className="w-8 h-8 text-orange-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-gray-900">{uploadedFileName}</p>
                        <p className="text-xs text-orange-600 font-bold mt-1">Feline-ready text extracted!</p>
                      </div>
                      <button 
                        onClick={() => {
                          setUploadedFileName(null);
                          setResume('');
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-xs font-bold text-rose-500 hover:text-rose-600 underline underline-offset-4"
                      >
                        Throw this one away
                      </button>
                    </div>
                  ) : (
                    <textarea
                      value={resume}
                      onChange={(e) => setResume(e.target.value)}
                      placeholder="Paste your resume text here or upload a .docx/.pdf file..."
                      className="w-full h-48 p-4 bg-white border-2 border-orange-50 rounded-3xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all resize-none shadow-sm outline-none"
                    />
                  )}
                  {isExtracting && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                      <span className="text-sm font-black text-gray-600">Sniffing out text...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Briefcase className="w-4 h-4 text-orange-500" />
                  Job Description
                </label>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-48 p-4 bg-white border-2 border-orange-50 rounded-3xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all resize-none shadow-sm outline-none"
                />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-bold"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <button
                onClick={handleOptimize}
                disabled={loading || isExtracting}
                className={cn(
                  "w-full py-5 rounded-3xl font-black text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-200 text-lg",
                  (loading || isExtracting) ? "bg-orange-300 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] hover:shadow-orange-300"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Working our magic...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6" />
                    Optimize Now!
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
                  className="h-full min-h-[600px] border-4 border-dashed border-orange-100 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-6 bg-white/50"
                >
                  <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center animate-bounce">
                    <Cat className="w-12 h-12 text-orange-300" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Waiting for your input!</h3>
                    <p className="text-gray-500 max-w-xs mx-auto text-lg">Fill in the details to see the magic happen. It's going to be paws-ome!</p>
                  </div>
                </motion.div>
              )}

              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[600px] bg-white border-2 border-orange-100 rounded-[3rem] p-8 flex flex-col items-center justify-center space-y-8 shadow-inner"
                >
                  <div className="relative">
                    <div className="w-32 h-32 border-8 border-orange-50 border-t-orange-500 rounded-full animate-spin" />
                    <PawPrint className="w-12 h-12 text-orange-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black text-gray-900">Sharpening Claws...</h3>
                    <p className="text-gray-500 text-lg">Our AI is making your resume feline-fine!</p>
                  </div>
                  <div className="w-full max-w-xs space-y-4">
                    <div className="h-3 bg-orange-50 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-orange-500"
                        animate={{ width: ["0%", "40%", "70%", "95%"] }}
                        transition={{ duration: 10, ease: "easeInOut" }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-black text-orange-400 uppercase tracking-widest">
                      <span>Sniffing</span>
                      <span>Purring</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {result && !loading && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  {/* Score Card */}
                  <div className="bg-white border-2 border-orange-100 rounded-[2.5rem] p-8 shadow-xl shadow-orange-100/50 flex items-center justify-between relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-orange-50 rounded-full opacity-50" />
                    <div className="flex items-center gap-6">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                          <path
                            className="text-orange-50"
                            strokeDasharray="100, 100"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <motion.path
                            className="text-orange-500"
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
                          <span className="text-2xl font-black text-gray-900">{result.atsScore}</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-gray-900">Purr-fect Match!</h4>
                        <p className="text-gray-500 font-medium">Your resume is feline-fine!</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={handleDownloadWord}
                        className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 text-sm shadow-lg"
                      >
                        <Download className="w-4 h-4" />
                        Get .docx
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        className="bg-white border-2 border-gray-900 text-gray-900 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-gray-50 transition-all active:scale-95 text-sm"
                      >
                        <FileUp className="w-4 h-4" />
                        Get .pdf
                      </button>
                    </div>
                  </div>

                  {/* Analysis Tabs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-orange-50 border-2 border-orange-100 rounded-3xl p-5">
                      <div className="flex items-center gap-2 text-orange-700 font-black text-sm mb-4 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4" />
                        Caught!
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsFound.map((kw, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white text-orange-600 text-xs font-bold rounded-xl border border-orange-200 shadow-sm">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-rose-50 border-2 border-rose-100 rounded-3xl p-5">
                      <div className="flex items-center gap-2 text-rose-700 font-black text-sm mb-4 uppercase tracking-wider">
                        <AlertCircle className="w-4 h-4" />
                        Missed...
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.keywordsMissing.map((kw, i) => (
                          <span key={i} className="px-3 py-1.5 bg-white text-rose-600 text-xs font-bold rounded-xl border border-rose-200 shadow-sm">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-8 relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12">
                      <Cat className="w-24 h-24" />
                    </div>
                    <h4 className="text-amber-900 font-black mb-6 flex items-center gap-2 text-lg">
                      <ChevronRight className="w-5 h-5" />
                      Cat-alyst for Success
                    </h4>
                    <ul className="space-y-4">
                      {result.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-4 text-amber-800 font-medium">
                          <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black">
                            {i + 1}
                          </span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Preview */}
                  <div className="bg-white border-2 border-orange-100 rounded-[2.5rem] overflow-hidden shadow-xl shadow-orange-100/30">
                    <div className="bg-orange-50 px-8 py-4 border-b-2 border-orange-100 flex items-center justify-between">
                      <span className="text-xs font-black text-orange-400 uppercase tracking-[0.2em]">Purr-view</span>
                      <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-300" />
                        <div className="w-3 h-3 rounded-full bg-amber-300" />
                        <div className="w-3 h-3 rounded-full bg-orange-300" />
                      </div>
                    </div>
                    <div className="p-10 max-h-[600px] overflow-y-auto prose prose-sm prose-orange max-w-none bg-white">
                      <div className="flex items-center gap-2 mb-8 border-b-2 border-orange-50 pb-4">
                        <FileText className="w-6 h-6 text-orange-500" />
                        <h3 className="text-xl font-black text-gray-900 m-0">Optimized Resume</h3>
                      </div>
                      <Markdown>{result.optimizedResume}</Markdown>
                      {result.coverLetter && (
                        <>
                          <div className="flex items-center gap-2 mb-8 border-b-2 border-orange-50 pb-4 mt-16">
                            <Heart className="w-6 h-6 text-rose-500" />
                            <h3 className="text-xl font-black text-gray-900 m-0">Tailored Cover Letter</h3>
                          </div>
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
      <footer className="bg-white border-t border-orange-50 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Cat className="w-6 h-6" />
            <Heart className="w-6 h-6 fill-current" />
            <Cat className="w-6 h-6" />
          </div>
          <p className="text-gray-400 font-bold text-sm">© 2026 PurrfectResume.com • Crafted with love and catnip.</p>
        </div>
      </footer>
    </div>
  );
}
