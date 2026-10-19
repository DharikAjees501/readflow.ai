"use client";

import React, { useState, useEffect } from "react";
import { ScanslatedView } from "@/components/ScanslatedView";
import { UploadModal } from "@/components/UploadModal";
import { ApiClient } from "@/lib/api";
import {
  DocumentDetailResponse,
  DocumentSummary,
  SpecializedTerm,
} from "@/lib/types";
import { UploadCloud, AlertCircle, Sparkles, ArrowRight } from "lucide-react";

export default function Home() {
  // App state
  const [docData, setDocData] = useState<DocumentDetailResponse | null>(null);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [selectedTerm, setSelectedTerm] = useState<SpecializedTerm | null>(null);

  // Modals & loading states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [heroDragActive, setHeroDragActive] = useState<boolean>(false);
  const heroFileInputRef = React.useRef<HTMLInputElement>(null);

  // Initial load: check if an active document is already loaded
  useEffect(() => {
    bootstrapApp();
  }, []);

  const bootstrapApp = async () => {
    try {
      const activeDoc = await ApiClient.getActiveDocument();
      if (activeDoc) {
        setDocData(activeDoc);
        const analysisStatus = await ApiClient.getAnalysisStatus();
        if (analysisStatus.is_analyzed && analysisStatus.summary) {
          setSummary(analysisStatus.summary);
          if (analysisStatus.summary.specialized_terms.length > 0) {
            setSelectedTerm(analysisStatus.summary.specialized_terms[0]);
          }
        } else {
          runAnalysis();
        }
      }
    } catch (err: any) {
      console.error("Bootstrap error:", err);
    }
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setGlobalError(null);
    try {
      const summaryData = await ApiClient.analyzeDocument();
      setSummary(summaryData);
      if (summaryData.specialized_terms.length > 0) {
        setSelectedTerm(summaryData.specialized_terms[0]);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setGlobalError(err?.message || "Failed to analyze document.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Upload custom PDF
  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    setGlobalError(null);
    try {
      const uploadedDoc = await ApiClient.uploadPdf(file);
      setDocData(uploadedDoc);
      setCurrentPageIndex(0);
      setSelectedTerm(null);
      // Run analysis on newly uploaded document
      await runAnalysis();
    } catch (err: any) {
      setGlobalError(err?.message || "Failed to upload PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  // Dynamic delete document (Step 1 Requirement)
  const handleDeleteDocument = async () => {
    if (!confirm("Are you sure you want to delete the active document?")) return;
    setIsDeleting(true);
    try {
      await ApiClient.deleteActiveDocument();
      setDocData(null);
      setSummary(null);
      setSelectedTerm(null);
      setCurrentPageIndex(0);
    } catch (err: any) {
      setGlobalError(err?.message || "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Term selection
  const handleSelectTerm = (term: SpecializedTerm) => {
    setSelectedTerm(term);
    if (term.page_number && term.page_number >= 1 && docData) {
      setCurrentPageIndex(Math.min(term.page_number - 1, docData.pages.length - 1));
    }
  };

  // Format clean document title
  const getDocumentCleanTitle = () => {
    if (!docData) return "Uploaded Document";
    const raw = docData.metadata.filename;
    return raw.replace(".pdf", "").replace(/[_-]/g, " ").trim();
  };

  // Hero drag-and-drop & file picker
  const handleHeroDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setHeroDragActive(true);
    } else if (e.type === "dragleave") {
      setHeroDragActive(false);
    }
  };

  const handleHeroDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHeroDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        await handleUploadFile(file);
      }
    }
  };

  const handleHeroFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await handleUploadFile(file);
    }
  };

  return (
    <div
      className={`bg-[#FCE2DB] flex flex-col font-sans ${
        docData ? "h-screen overflow-hidden" : "min-h-screen overflow-y-auto custom-scrollbar"
      }`}
    >
      {/* Global Error Banner if any */}
      {globalError && (
        <div className="shrink-0 bg-amber-100 border-b border-amber-300 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-amber-800 font-bold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace / Framer-Inspired Landing Hero */}
      <main
        className={
          docData
            ? "flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4 pb-4 flex flex-col overflow-hidden"
            : "flex-1 w-full flex flex-col items-center justify-start pt-12 sm:pt-20 pb-20 px-4 sm:px-6"
        }
      >
        {docData ? (
          <ScanslatedView
            pages={docData.pages}
            currentPageIndex={currentPageIndex}
            onPageChange={setCurrentPageIndex}
            specializedTerms={summary?.specialized_terms || []}
            selectedTerm={selectedTerm}
            onSelectTerm={handleSelectTerm}
            onCloseCard={() => setSelectedTerm(null)}
            documentTitle={getDocumentCleanTitle()}
            documentDate="October 2026"
            domain={summary?.detected_domain}
            documentId={docData.metadata.id}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onDeleteDocument={handleDeleteDocument}
            isDeleting={isDeleting}
          />
        ) : (
          /* Framer-Inspired Hero Section: The Document Is Your Canvas */
          <div
            onDragEnter={handleHeroDrag}
            onDragLeave={handleHeroDrag}
            onDragOver={handleHeroDrag}
            onDrop={handleHeroDrop}
            className="w-full max-w-5xl mx-auto flex flex-col items-center text-center animate-fade-in relative z-10"
          >
            {/* Top pill badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-[#E4A3D4] text-[#3D2347] text-xs font-bold uppercase tracking-wider mb-6 shadow-sm backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#C295D8]" />
              <span>Interactive Document Intelligence</span>
            </div>

            {/* Giant Framer-Style Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-[#3D2347] leading-[1.05] max-w-4xl mx-auto">
              ReadFlow<span className="text-[#C295D8]">.ai</span> is your canvas.
            </h1>

            {/* Framer-Style Subtitle */}
            <p className="text-base sm:text-xl text-[#6E497A] font-medium max-w-2xl mx-auto mt-4 sm:mt-5 leading-relaxed">
              ReadFlow.ai is where researchers, students, and engineers transform complex papers into interactive, plain-English visual learning.
            </p>

            {/* Framer-Style Floating Pill Upload Bar */}
            <div className="w-full max-w-2xl mx-auto mt-8 sm:mt-10">
              <div
                onClick={() => heroFileInputRef.current?.click()}
                className={`group relative bg-white/95 border-2 rounded-full p-2 pl-6 sm:pl-7 shadow-[0_12px_36px_rgba(228,163,212,0.35)] flex items-center justify-between gap-3 cursor-pointer transition-all duration-300 ${
                  heroDragActive
                    ? "border-[#C295D8] ring-4 ring-[#E4A3D4]/50 scale-[1.02] bg-[#F1C6D3]/30"
                    : "border-[#E4A3D4] hover:border-[#C295D8] hover:shadow-[0_16px_40px_rgba(228,163,212,0.45)]"
                }`}
              >
                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleHeroFileChange}
                  className="hidden"
                />

                {/* Left: Input text placeholder / drop indicator */}
                <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
                  <div className="w-9 h-9 rounded-full bg-[#F1C6D3]/80 border border-[#E4A3D4] flex items-center justify-center text-[#C295D8] shrink-0 group-hover:scale-110 transition-transform">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <span className="text-sm sm:text-base text-[#6E497A] truncate font-medium">
                    {heroDragActive ? (
                      <span className="text-[#3D2347] font-bold">Release PDF to upload...</span>
                    ) : (
                      <span>Upload or drop any research paper, medical report, or PDF...</span>
                    )}
                  </span>
                </div>

                {/* Right: Framer-Style "Start with AI" Pill Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    heroFileInputRef.current?.click();
                  }}
                  disabled={isUploading}
                  className="pastel-btn px-5 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm rounded-full flex items-center gap-2 shrink-0 font-bold"
                >
                  <Sparkles className="w-4 h-4 text-yellow-100" />
                  <span>Start with AI</span>
                </button>
              </div>

              {/* In-hero Upload Progress Bar */}
              {isUploading && (
                <div className="mt-4 bg-white/95 border-2 border-[#E4A3D4] rounded-2xl p-4 shadow-sm text-left animate-fade-in max-w-xl mx-auto">
                  <div className="flex items-center justify-between text-xs font-bold text-[#6E497A] mb-2">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#C295D8] animate-spin" />
                      <span>Synthesizing document vectors &amp; extracting jargon...</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#C295D8] text-white text-[11px] font-black">
                      Extracting
                    </span>
                  </div>
                  <div className="w-full bg-[#FCE2DB] h-2.5 rounded-full overflow-hidden border border-[#E4A3D4]">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#C295D8] via-[#E4A3D4] to-[#0D9488] animate-pulse w-3/4" />
                  </div>
                </div>
              )}
            </div>

            {/* Category Navigation Links (mirroring Framer's Design Collaborate Publish CMS Localize) */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-7 sm:mt-9 text-xs sm:text-sm font-semibold text-[#8A6590]">
              {["Medicine & Clinical", "Software Architecture", "Engineering", "Finance & Math", "Scientific Research"].map((domain) => (
                <span
                  key={domain}
                  className="hover:text-[#3D2347] transition-colors cursor-default tracking-wide"
                >
                  {domain}
                </span>
              ))}
            </div>

            {/* Framer-Style Peeking Canvas Preview Frame */}
            <div className="w-full max-w-4xl mx-auto mt-12 sm:mt-16 relative">
              {/* Soft ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#E4A3D4]/35 via-[#F1C6D3]/20 to-transparent blur-2xl -z-10 rounded-3xl" />

              {/* Canvas Preview Container */}
              <div className="bg-white/80 backdrop-blur-md border-2 border-[#E4A3D4] rounded-3xl p-4 sm:p-6 shadow-[0_20px_50px_rgba(228,163,212,0.3)] text-left">
                {/* Window top bar */}
                <div className="flex items-center justify-between pb-3.5 border-b border-[#E4A3D4]/50 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-300" />
                    <div className="w-3 h-3 rounded-full bg-amber-300" />
                    <div className="w-3 h-3 rounded-full bg-emerald-300" />
                    <span className="text-xs font-bold text-[#6E497A] ml-2">readflow-interactive-canvas-preview</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[#9469A3]">
                    <span className="px-2 py-0.5 rounded-full bg-[#F1C6D3] text-[#3D2347]">Dual-Engine AI</span>
                    <span>PyMuPDF + Gemini 3.0</span>
                  </div>
                </div>

                {/* Mini preview layout simulating Scanslated View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left simulated doc */}
                  <div className="bg-[#FAF8F5] border border-gray-200 rounded-2xl p-4 text-xs font-serif text-gray-800 space-y-2.5">
                    <div className="h-4 w-3/4 bg-gray-300 rounded mb-2" />
                    <p className="leading-relaxed">
                      The clinical trial evaluated the efficacy of{" "}
                      <span className="scanslated-term-active">myocardial perfusion</span>{" "}
                      imaging in assessing coronary microvascular dysfunction. Quantitative analysis revealed significant correlation with{" "}
                      <span className="scanslated-term-purple">hemodynamic flow</span>{" "}
                      parameters across multi-slice cardiac tomography.
                    </p>
                    <p className="text-gray-400 text-[11px] italic">
                      [Click any underlined concept to open plain-English explanations &amp; dynamic visual schematics]
                    </p>
                  </div>

                  {/* Right simulated AI card */}
                  <div className="scanslated-card p-4 text-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-300 text-sm">myocardial perfusion</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[10px] font-bold">Medicine</span>
                    </div>
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      Plain-English: Blood flow through the small blood vessels that nourish the heart muscle tissue. When restricted, the heart muscle receives insufficient oxygen.
                    </p>
                    <div className="h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-teal-200 text-xs gap-2 font-medium">
                      <Sparkles className="w-4 h-4 text-teal-300" />
                      <span>Dynamic SVG &amp; Gemini 3D Architecture Visual</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        isUploading={isUploading}
      />
    </div>
  );
}
