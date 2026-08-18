import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ArrowLeft,
  MapPin,
  Paperclip,
  X,
  Upload,
  Send,
  AlertCircle,
  ChevronDown,
  ImageIcon,
  FileText,
  Video,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Water Supply',
  'Road Infrastructure',
  'Sanitation & Drainage',
  'Electricity',
  'Street Lighting',
  'Garbage Collection',
  'Public Property Damage',
  'Noise Pollution',
  'Other',
];

const MAX_FILE_SIZE_MB = 10;
const MAX_FILES = 5;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'];

function generateReadableId() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `GRV-${num}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ htmlFor, required, children }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function FieldHint({ children }) {
  return (
    <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
      <Info className="h-3 w-3 flex-shrink-0" />
      {children}
    </p>
  );
}

function FileCard({ file, onRemove }) {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const sizeKB = (file.size / 1024).toFixed(0);

  const icon = isImage ? (
    <ImageIcon className="h-5 w-5 text-blue-500" />
  ) : isVideo ? (
    <Video className="h-5 w-5 text-purple-500" />
  ) : (
    <FileText className="h-5 w-5 text-orange-500" />
  );

  const preview = isImage ? URL.createObjectURL(file) : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-3 group"
    >
      {preview ? (
        <img src={preview} alt={file.name} className="w-10 h-10 rounded object-cover flex-shrink-0 border border-slate-200" />
      ) : (
        <div className="w-10 h-10 rounded bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{file.name}</p>
        <p className="text-xs text-slate-500">{sizeKB} KB</p>
      </div>
      <button
        type="button"
        onClick={() => onRemove(file.name)}
        className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function CharCounter({ value, max }) {
  const pct = (value.length / max) * 100;
  const color = pct >= 90 ? 'text-red-500' : pct >= 70 ? 'text-amber-500' : 'text-slate-400';
  return <span className={`text-xs font-mono ${color}`}>{value.length}/{max}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SubmitGrievance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [files, setFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fileError, setFileError] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  function validate() {
    const errs = {};
    if (!title.trim() || title.trim().length < 5) {
      errs.title = 'Please enter a title (at least 5 characters).';
    }
    if (!description.trim() || description.trim().length < 20) {
      errs.description = 'Please describe the issue in at least 20 characters.';
    }
    if (!location.trim()) {
      errs.location = 'Please enter the location of the issue.';
    }
    return errs;
  }

  function processFiles(incoming) {
    setFileError('');
    const valid = [];
    for (const f of incoming) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setFileError('Only JPG, PNG, WEBP, MP4, and PDF files are supported.');
        continue;
      }
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`"${f.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`);
        continue;
      }
      if (files.length + valid.length >= MAX_FILES) {
        setFileError(`You can upload a maximum of ${MAX_FILES} files.`);
        break;
      }
      if (!files.find((x) => x.name === f.name && x.size === f.size)) {
        valid.push(f);
      }
    }
    setFiles((prev) => [...prev, ...valid]);
  }

  function handleFileInput(e) {
    processFiles(Array.from(e.target.files));
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    processFiles(Array.from(e.dataTransfer.files));
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setIsSubmitting(true);
    setSubmitError('');

    const readableId = generateReadableId();

    // ── 1. Upload evidence files to Supabase Storage ──────────────────────────
    const evidenceUrls = [];

    if (files.length > 0) {
      for (const file of files) {
        // Path: evidence/{user_id}/{readableId}/{filename}
        const ext = file.name.split('.').pop();
        const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const path = `${user.id}/${readableId}/${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from('evidence')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.warn('File upload failed:', file.name, uploadError.message);
          continue; // skip this file but don't block submission
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from('evidence')
          .getPublicUrl(path);

        evidenceUrls.push(urlData.publicUrl);
      }
    }

    // ── 2. Insert grievance row with evidence URLs ─────────────────────────────
    const { data, error } = await supabase.from('grievances').insert({
      user_id: user.id,
      readable_id: readableId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Other',
      location: location.trim(),
      status: 'submitted',
      priority: 'medium',
      evidence_urls: evidenceUrls,
    }).select().single();

    setIsSubmitting(false);

    if (error) {
      setSubmitError('Failed to submit grievance. Please try again.');
      console.error(error);
      return;
    }

    navigate(`/submitted/${data.id}`);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-700" />
              <span className="font-bold text-slate-900 text-lg">Pravah</span>
            </div>
          </div>
          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Citizen Portal
          </span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Submit a Grievance</h1>
          <p className="mt-2 text-slate-500 text-base">
            Tell us what happened. Our AI will structure your complaint and assign it to the right department.
          </p>
        </motion.div>

        {submitError && (
          <div className="mb-5 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Section 1: Title & Description */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5"
          >
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
              Describe the Issue
            </h2>

            {/* Title */}
            <div className="mb-5">
              <FieldLabel htmlFor="grievance-title" required>Short Title</FieldLabel>
              <input
                id="grievance-title"
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value.slice(0, 120)); if (errors.title) setErrors(p => ({ ...p, title: '' })); }}
                placeholder="e.g. Pothole on Main Road causing accidents"
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.title ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
                }`}
              />
              <AnimatePresence>
                {errors.title && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.title}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Description */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-1.5">
                <FieldLabel htmlFor="description" required>Detailed Description</FieldLabel>
                <CharCounter value={description} max={1000} />
              </div>
              <textarea
                id="description"
                value={description}
                onChange={(e) => { setDescription(e.target.value.slice(0, 1000)); if (errors.description) setErrors((p) => ({ ...p, description: '' })); }}
                rows={5}
                placeholder="Describe your issue in detail. For example: There has been no water supply in our area for 4 days. Multiple households in Ward 5 are affected..."
                className={`w-full px-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 resize-none focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.description ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
                }`}
              />
              <AnimatePresence>
                {errors.description && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.description}
                  </motion.p>
                )}
              </AnimatePresence>
              <FieldHint>Be specific — mention how long the issue has existed and how many people are affected.</FieldHint>
            </div>

            {/* Category */}
            <div className="relative">
              <FieldLabel htmlFor="category">Category (auto-suggested by AI)</FieldLabel>
              <button
                id="category"
                type="button"
                onClick={() => setShowCategoryDropdown((p) => !p)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              >
                <span className={category ? 'text-slate-900' : 'text-slate-400'}>
                  {category || 'Select a category (or leave for AI to decide)'}
                </span>
                <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showCategoryDropdown && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
                  >
                    <li>
                      <button type="button" className="w-full text-left px-4 py-2.5 text-sm text-slate-500 italic hover:bg-slate-50"
                        onClick={() => { setCategory(''); setShowCategoryDropdown(false); }}>
                        Let AI decide automatically
                      </button>
                    </li>
                    {CATEGORIES.map((cat) => (
                      <li key={cat}>
                        <button type="button"
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors ${category === cat ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'}`}
                          onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}>
                          {cat}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
              <FieldHint>The Triage AI Agent will validate and refine the category automatically.</FieldHint>
            </div>
          </motion.section>

          {/* Section 2: Location */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5"
          >
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
              Location
            </h2>
            <div>
              <FieldLabel htmlFor="location" required>Issue Location</FieldLabel>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); if (errors.location) setErrors((p) => ({ ...p, location: '' })); }}
                  placeholder="e.g. Ward 5, Near Government School, Main Road"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 transition-all duration-200 ${
                    errors.location ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-slate-300 focus:ring-blue-200 focus:border-blue-500 bg-white'
                  }`}
                />
              </div>
              <AnimatePresence>
                {errors.location && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.location}
                  </motion.p>
                )}
              </AnimatePresence>
              <FieldHint>Ward number, landmark, street name, or colony name helps officers reach the site faster.</FieldHint>
            </div>
          </motion.section>

          {/* Section 3: Evidence Upload */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-5"
          >
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
              Upload Evidence <span className="text-xs font-normal text-slate-400 ml-1">(optional)</span>
            </h2>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_TYPES.join(',')} onChange={handleFileInput} className="hidden" />
              <Upload className={`mx-auto h-8 w-8 mb-3 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
              <p className="text-sm font-semibold text-slate-700">
                {isDragging ? 'Drop files here' : 'Drag & drop files, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                JPG, PNG, WEBP, MP4, PDF · Max {MAX_FILE_SIZE_MB} MB per file · Up to {MAX_FILES} files
              </p>
            </div>

            <AnimatePresence>
              {fileError && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 flex-shrink-0" /> {fileError}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {files.length} file{files.length > 1 ? 's' : ''} attached
                    </p>
                    <button type="button" onClick={() => setFiles([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
                      Remove all
                    </button>
                  </div>
                  {files.map((f) => (
                    <FileCard key={f.name + f.size} file={f} onRemove={removeFile} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <FieldHint>Photos and videos significantly speed up the resolution process and help AI verify the issue.</FieldHint>
          </motion.section>

          {/* Submit */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 items-center justify-between"
          >
            <p className="text-xs text-slate-500 flex items-start gap-1.5 max-w-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
              Your information is protected and will only be used for grievance resolution.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg w-full sm:w-auto min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              <AnimatePresence mode="wait">
                {isSubmitting ? (
                  <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    {files.length > 0 ? `Uploading ${files.length} file${files.length > 1 ? 's' : ''}…` : 'Submitting…'}
                  </motion.span>
                ) : (
                  <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Submit Grievance
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </form>
      </main>
    </div>
  );
}
