/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Copy, 
  Check, 
  RefreshCcw, 
  Coffee,
  Languages,
  X,
  CreditCard,
  Zap
} from "lucide-react";
import { generateCaptions } from "./services/geminiService";

const DAILY_LIMIT = 10;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showUpi, setShowUpi] = useState(false);
  const [remainingCredits, setRemainingCredits] = useState(DAILY_LIMIT);
  const [upiCopied, setUpiCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Credit tracking logic
  useEffect(() => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem("caption_limit_date");
    const count = localStorage.getItem("caption_limit_count");

    if (lastDate !== today) {
      localStorage.setItem("caption_limit_date", today);
      localStorage.setItem("caption_limit_count", DAILY_LIMIT.toString());
      setRemainingCredits(DAILY_LIMIT);
    } else if (count) {
      setRemainingCredits(parseInt(count, 10));
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processFile(selected);
    }
  };

  const processFile = (selected: File) => {
    setFile(selected);
    setError(null);
    setCaptions([]);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selected);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setCaptions([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!preview || !file) return;
    if (remainingCredits <= 0) {
      setError("Daily limit reached. Try again tomorrow!");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const results = await generateCaptions(preview, file.type, userPrompt);
      setCaptions(results);
      
      const newCredits = remainingCredits - 1;
      setRemainingCredits(newCredits);
      localStorage.setItem("caption_limit_count", newCredits.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyUpi = () => {
    navigator.clipboard.writeText("anncowwd@axl");
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-[#1A1A1A] font-sans selection:bg-orange-100 p-4 md:p-8 flex flex-col items-center">
      {/* Credit Indicator */}
      <div className="fixed top-4 left-4 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 z-50">
        <Zap className={`w-4 h-4 ${remainingCredits > 0 ? "text-orange-500 fill-orange-500" : "text-gray-300"}`} />
        <span className="text-sm font-bold text-gray-600">
          {remainingCredits} / {DAILY_LIMIT} daily credits
        </span>
      </div>

      {/* Header */}
      <header className="max-w-3xl w-full text-center mb-4 pt-12 md:pt-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold tracking-tight mb-2"
          id="app-title"
        >
          Flash<span className="text-orange-600">Captions</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-gray-400 font-medium"
        >
          Get the perfect words for your memories.
        </motion.p>
      </header>

      <main className="max-w-2xl w-full space-y-6 pb-20">
        {/* Upload Section */}
        <section className="space-y-4">
          {!preview ? (
            <motion.div
              id="upload-zone"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orange-200 transition-colors bg-white shadow-sm"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files[0];
                if (dropped) processFile(dropped);
              }}
            >
              <div className="bg-orange-50 p-4 rounded-full mb-4">
                <Upload className="w-8 h-8 text-orange-500" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-1">Tap to upload</h2>
              <p className="text-base text-gray-400 font-medium">Photos or videos welcome</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*,video/*"
                className="hidden" 
              />
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-2xl flex items-center justify-center"
            >
              {file?.type.startsWith("video") ? (
                <video src={preview} controls className="w-full h-full object-contain" />
              ) : (
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              )}
              <button 
                onClick={clearFile}
                className="absolute top-4 right-4 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-transform hover:rotate-90"
                id="clear-button"
                aria-label="Remove file"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          )}
        </section>

        {/* Input Section */}
        <AnimatePresence>
          {preview && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <label htmlFor="prompt" className="flex items-center gap-2 text-xl font-bold ml-1">
                  <Languages className="w-6 h-6 text-orange-600" />
                  What language? (or add context)
                </label>
                <textarea
                  id="prompt"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="e.g. In Spanish, make it funny, mention my family..."
                  className="w-full p-4 md:p-6 text-xl md:text-2xl rounded-2xl border-2 border-gray-100 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-300 min-h-[100px] bg-white shadow-sm"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || remainingCredits <= 0}
                className="w-full bg-[#1A1A1A] text-white py-5 md:py-6 rounded-2xl text-2xl md:text-3xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                id="generate-button"
              >
                {loading ? (
                  <>
                    <RefreshCcw className="w-8 h-8 animate-spin" />
                    Analyzing...
                  </>
                ) : remainingCredits <= 0 ? (
                  "Limit Reached"
                ) : (
                  "Generate 3 Captions"
                )}
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <div className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-6 rounded-2xl font-bold text-xl border border-red-100">
              {error}
            </div>
          )}

          <AnimatePresence>
            {captions.length > 0 && (
              <motion.div 
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.15
                    }
                  }
                }}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <h3 className="text-xl font-bold uppercase tracking-widest text-gray-400 mb-2">Options</h3>
                {captions.map((caption, idx) => (
                  <motion.div
                    key={idx}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                      show: { 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 100,
                          damping: 15
                        }
                      }
                    }}
                    className="group bg-white p-6 md:p-8 rounded-3xl border-2 border-gray-50 shadow-sm hover:border-orange-200 transition-all cursor-default"
                  >
                    <p className="text-2xl md:text-3xl leading-relaxed mb-6 font-medium">
                      {caption}
                    </p>
                    <button
                      onClick={() => copyToClipboard(caption, idx)}
                      className={`flex items-center gap-3 px-6 py-3 rounded-xl text-lg font-bold transition-all ${
                        copiedIndex === idx 
                        ? "bg-green-100 text-green-700" 
                        : "bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600"
                      }`}
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-5 h-5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-5 h-5" />
                          Copy Caption
                        </>
                      )}
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Donation */}
      <footer className="mt-auto pt-12 pb-8 flex flex-col items-center gap-6">
        <AnimatePresence>
          {showUpi && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-orange-100 flex flex-col items-center gap-4 mb-4 text-center max-w-sm"
            >
              <h4 className="text-xl font-bold">Support FlashCaptions ☕️</h4>
              <p className="text-gray-500">Donate via UPI to help keep the AI running!</p>
              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 w-full justify-between">
                <code className="text-lg font-mono font-bold text-orange-600">anncowwd@axl</code>
                <button 
                  onClick={copyUpi}
                  className="p-2 hover:bg-orange-100 rounded-lg transition-colors"
                  aria-label="Copy UPI ID"
                >
                  {upiCopied ? <Check className="text-green-600" /> : <Copy className="text-gray-400" />}
                </button>
              </div>
              <button 
                onClick={() => setShowUpi(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setShowUpi(!showUpi)}
          className="bg-[#FFDD00] text-[#1A1A1A] px-8 py-5 rounded-2xl text-xl md:text-2xl font-black shadow-lg hover:shadow-xl transition-all flex items-center gap-4 hover:-translate-y-1 active:scale-95"
          id="donation-button"
        >
          <Coffee className="w-7 h-7 fill-current" />
          Buy me a coffee
        </button>
      </footer>
    </div>
  );
}

