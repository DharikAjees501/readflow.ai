"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Sparkles,
  ExternalLink,
  Eye,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  BookOpen,
} from "lucide-react";
import {
  SpecializedTerm,
  DeepSearchResponse,
  VisualGenerateResponse,
} from "@/lib/types";
import { ApiClient } from "@/lib/api";

interface DetailDrawerProps {
  term: SpecializedTerm | null;
  domain?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  term,
  domain,
  isOpen,
  onClose,
}) => {
  // On-demand states
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchData, setSearchData] = useState<DeepSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [visualLoading, setVisualLoading] = useState(false);
  const [visualData, setVisualData] = useState<VisualGenerateResponse | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);

  // Reset on-demand results when a new term is selected
  useEffect(() => {
    setSearchData(null);
    setSearchError(null);
    setVisualData(null);
    setVisualError(null);
    setVisualLoading(false);
    if (term) {
      setSearchLoading(true);
      ApiClient.triggerDeepSearch(term.term, domain, term.context_sentence)
        .then((res) => setSearchData(res))
        .catch((err: any) => setSearchError(err?.message || "Failed to complete web search."))
        .finally(() => setSearchLoading(false));
    } else {
      setSearchLoading(false);
    }
  }, [term?.id, term?.term]);

  // On-demand handler 2: Generate Visual Schematic matching pastel palette
  const handleTriggerVisualGeneration = async () => {
    if (!term) return;
    setVisualLoading(true);
    setVisualError(null);
    try {
      const res = await ApiClient.triggerVisualGeneration(
        term.term,
        domain,
        term.short_definition,
        undefined,
        term.context_sentence
      );
      setVisualData(res);
    } catch (err: any) {
      setVisualError(err?.message || "Failed to generate visual schematic.");
    } finally {
      setVisualLoading(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!visualData || !term) return;
    const blob = new Blob([visualData.svg_code], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${term.term.replace(/\s+/g, "_")}_schematic.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen || !term) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: "100%", opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="fixed top-0 right-0 z-40 w-full sm:w-[480px] lg:w-[520px] h-full bg-[#FCE2DB] border-l-4 border-[#E4A3D4] shadow-[-10px_0_30px_rgba(228,163,212,0.4)] flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b-2 border-[#E4A3D4] bg-[#F1C6D3]/80 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white text-[#6E497A] border border-[#E4A3D4]">
                {term.category}
              </span>
              {domain && (
                <span className="text-[10px] font-bold text-[#9469A3]">
                  • {domain}
                </span>
              )}
            </div>
            <h2 className="text-xl font-black text-[#3D2347] leading-tight">
              {term.term}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/80 border-2 border-[#E4A3D4] text-[#6E497A] hover:bg-[#FCE2DB] transition shadow-sm"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Concept Classification Banner (Step 3: Differentiating Simple vs Visual) */}
          <div
            className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 ${
              term.kind === "visual_concept"
                ? "bg-[#F1C6D3]/70 border-[#C295D8]"
                : "bg-white/80 border-[#E4A3D4]"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                term.kind === "visual_concept"
                  ? "bg-[#C295D8] text-white shadow-sm"
                  : "bg-[#FCE2DB] text-[#6E497A] border border-[#E4A3D4]"
              }`}
            >
              {term.kind === "visual_concept" ? (
                <Eye className="w-5 h-5" />
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#9469A3] block">
                {term.kind === "visual_concept"
                  ? "Visual System Concept"
                  : "Standard Term / Formulation"}
              </span>
              <p className="text-xs font-semibold text-[#3D2347]">
                {term.kind === "visual_concept"
                  ? term.visual_reasoning || "Well-suited for schematic & diagrammatic breakdown."
                  : "Clearly defined through rigorous text definition or mathematical formula."}
              </p>
            </div>
          </div>

          {/* Definition Box */}
          <div className="p-4 rounded-3xl bg-white/90 border-2 border-[#E4A3D4] shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6E497A] mb-2">
              Concise Definition
            </h3>
            <p className="text-sm text-[#3D2347] leading-relaxed font-normal">
              {term.short_definition}
            </p>

            {/* Formula Display if Available */}
            {term.formula && (
              <div className="mt-3 p-3 rounded-2xl bg-[#FCE2DB]/70 border-2 border-[#E4A3D4]/80">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C295D8] block mb-1">
                  Formula / Mathematical Notation
                </span>
                <code className="text-xs font-mono font-bold text-[#3D2347] block overflow-x-auto">
                  {term.formula}
                </code>
              </div>
            )}
          </div>

          {/* PDF Context Excerpt */}
          {term.context_sentence && (
            <div className="p-4 rounded-3xl bg-[#F1C6D3]/40 border-2 border-[#E4A3D4] shadow-sm">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-[#C295D8]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-[#6E497A]">
                  Context in Uploaded PDF (Page {term.page_number || 1})
                </h3>
              </div>
              <p className="text-xs text-[#3D2347] italic font-serif leading-relaxed">
                "{term.context_sentence}"
              </p>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3 & 4: ON-DEMAND ACTION 1 - DEEP SEARCH WITH GROUNDING */}
          {/* ======================================================== */}
          <div className="p-4 rounded-3xl bg-white/90 border-2 border-[#E4A3D4] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#F1C6D3] border border-[#E4A3D4]">
                  <Search className="w-4 h-4 text-[#C295D8]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2347]">
                    Live Web &amp; Academic Search
                  </h3>
                  <p className="text-[10px] text-[#6E497A]">
                    Automated scholarly synthesis &amp; verified knowledge
                  </p>
                </div>
              </div>
            </div>

            {searchLoading && (
              <div className="py-6 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full border-3 border-[#C295D8] border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-[#6E497A]">
                  Synthesizing live web &amp; academic search insights...
                </p>
              </div>
            )}

            {searchError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            {searchData && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#FCE2DB]/50 border border-[#E4A3D4]">
                  <span className="text-[10px] font-bold text-[#9469A3] uppercase block mb-1">
                    Academic Grounding Summary
                  </span>
                  <div className="text-xs text-[#3D2347] leading-relaxed whitespace-pre-line">
                    {searchData.summary}
                  </div>
                </div>

                {searchData.key_findings.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-[#6E497A] mb-1.5 uppercase">
                      Key Real-World Findings:
                    </h4>
                    <ul className="space-y-1.5">
                      {searchData.key_findings.map((f, i) => (
                        <li
                          key={i}
                          className="text-xs text-[#3D2347] flex items-start gap-2 bg-[#F1C6D3]/30 p-2 rounded-xl"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C295D8] shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Sources list */}
                {searchData.sources.length > 0 && (
                  <div className="pt-2 border-t border-[#E4A3D4]/50">
                    <h4 className="text-[10px] font-bold text-[#6E497A] uppercase mb-1.5">
                      Verified Academic Sources &amp; Literature:
                    </h4>
                    <div className="space-y-1.5">
                      {searchData.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl bg-white hover:bg-[#F1C6D3]/60 border border-[#E4A3D4] text-xs font-semibold text-[#3D2347] group transition"
                        >
                          <span className="truncate max-w-[320px]">{src.title}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#C295D8] group-hover:scale-110 transition" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* STEP 3 & 4: ON-DEMAND ACTION 2 - AI VISUAL SCHEMATIC GENERATION */}
          {/* ======================================================== */}
          <div className="p-4 rounded-3xl bg-white/90 border-2 border-[#E4A3D4] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#F1C6D3] border border-[#E4A3D4]">
                  <Eye className="w-4 h-4 text-[#C295D8]" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#3D2347]">
                    On-Demand Pastel Illustration
                  </h3>
                  <p className="text-[10px] text-[#6E497A]">
                    Cartoony vector schematic (#FCE2DB, #F1C6D3, #E4A3D4, #C295D8)
                  </p>
                </div>
              </div>
            </div>

            {!visualData && !visualLoading && (
              <div className="text-center py-2">
                <p className="text-xs text-[#6E497A] mb-3">
                  {term.kind === "visual_concept"
                    ? "This is classified as a visual concept. Generate a custom pastel vector schematic showing internal mechanics, component nodes, and cyclic flows."
                    : "This concept is primarily mathematical or text-based. You can still generate a visual schematic on-demand if desired."}
                </p>
                <button
                  onClick={handleTriggerVisualGeneration}
                  className="pastel-btn w-full py-2.5 text-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Generate Pastel Schematic for "{term.term}"
                  </span>
                </button>
              </div>
            )}

            {visualLoading && (
              <div className="py-8 text-center space-y-2">
                <div className="w-8 h-8 mx-auto rounded-full border-3 border-[#C295D8] border-t-transparent animate-spin" />
                <p className="text-xs font-bold text-[#6E497A]">
                  Synthesizing vector schematic in pastel palette...
                </p>
              </div>
            )}

            {visualError && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-300 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{visualError}</span>
              </div>
            )}

            {visualData && (
              <div className="space-y-3">
                {/* SVG Visual Display */}
                <div className="rounded-2xl border-2 border-[#E4A3D4] overflow-hidden bg-[#FCE2DB] p-2 shadow-inner">
                  <div
                    dangerouslySetInnerHTML={{ __html: visualData.svg_code }}
                    className="w-full flex justify-center items-center"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#9469A3]">
                    {visualData.title}
                  </span>
                  <button
                    onClick={handleDownloadSvg}
                    className="pastel-btn-secondary px-3 py-1 text-[11px] flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download SVG</span>
                  </button>
                </div>

                {/* Component Breakdown Tags */}
                {visualData.labeled_components.length > 0 && (
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#6E497A] block mb-1">
                      Labeled Diagram Components:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visualData.labeled_components.map((comp, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#F1C6D3] text-[#3D2347] border border-[#E4A3D4]"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
