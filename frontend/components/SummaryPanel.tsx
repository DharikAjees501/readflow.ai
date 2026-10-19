"use client";

import React, { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Tag,
  Eye,
  FileText,
  Clock,
  ChevronRight,
  Lightbulb,
  CheckCircle,
} from "lucide-react";
import { DocumentSummary, SpecializedTerm } from "@/lib/types";
import { FormattedText } from "@/lib/formatText";

interface SummaryPanelProps {
  summary: DocumentSummary | null;
  isLoading: boolean;
  onSelectTerm: (term: SpecializedTerm) => void;
  selectedTermId?: string | null;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  summary,
  isLoading,
  onSelectTerm,
  selectedTermId,
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "terms">("summary");
  const [filterType, setFilterType] = useState<"all" | "visual" | "simple">("all");

  if (isLoading) {
    return (
      <aside className="w-full lg:w-96 shrink-0 bg-[#FFFFFF]/80 border-2 border-[#E4A3D4] rounded-3xl p-6 flex flex-col gap-4 shadow-sm animate-pulse">
        <div className="h-6 bg-[#E4A3D4]/60 rounded-xl w-3/4" />
        <div className="h-24 bg-[#F1C6D3]/40 rounded-2xl" />
        <div className="h-32 bg-[#F1C6D3]/40 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-12 bg-[#F1C6D3]/40 rounded-xl" />
          <div className="h-12 bg-[#F1C6D3]/40 rounded-xl" />
        </div>
      </aside>
    );
  }

  if (!summary) {
    return (
      <aside className="w-full lg:w-96 shrink-0 bg-white/70 border-2 border-dashed border-[#E4A3D4] rounded-3xl p-8 flex flex-col items-center justify-center text-center text-[#6E497A]">
        <div className="w-12 h-12 rounded-2xl bg-[#F1C6D3] border-2 border-[#E4A3D4] flex items-center justify-center mb-3 text-[#C295D8]">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-[#3D2347]">No Document Analyzed</h3>
        <p className="text-xs mt-1 max-w-[220px]">
          Upload any PDF to extract the executive summary and key technical concepts.
        </p>
      </aside>
    );
  }

  const filteredTerms = summary.specialized_terms.filter((t) => {
    if (filterType === "visual") return t.kind === "visual_concept";
    if (filterType === "simple") return t.kind === "simple_concept";
    return true;
  });

  return (
    <aside className="w-full lg:w-96 shrink-0 flex flex-col gap-3 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
      {/* 1. Unified Document Header Card */}
      <div className="bg-white/95 border-2 border-[#E4A3D4] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#9469A3]">
            Document Classification
          </span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FCE2DB] text-[#6E497A] border border-[#E4A3D4] flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C295D8]" />
            {summary.reading_time_minutes} min read
          </span>
        </div>
        <h2 className="text-base font-black text-[#3D2347] leading-snug">
          {summary.detected_domain}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-md bg-[#F1C6D3] font-bold text-[10px] text-[#3D2347]">
            {summary.complexity_level} Level
          </span>
          <span className="text-[#9469A3]">•</span>
          <span className="text-xs font-semibold text-[#6E497A]">
            {summary.total_terms_detected} Key Concepts
          </span>
        </div>
      </div>

      {/* 2. Clear Two-Tab Selector */}
      <div className="flex items-center gap-1 bg-[#F1C6D3]/50 p-1 rounded-2xl border border-[#E4A3D4]">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "summary"
              ? "bg-[#C295D8] text-white shadow-sm"
              : "text-[#6E497A] hover:bg-white/60"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Executive Summary</span>
        </button>
        <button
          onClick={() => setActiveTab("terms")}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeTab === "terms"
              ? "bg-[#C295D8] text-white shadow-sm"
              : "text-[#6E497A] hover:bg-white/60"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Technical Terms ({summary.specialized_terms.length})</span>
        </button>
      </div>

      {/* 3. Tab Content */}
      {activeTab === "summary" ? (
        <div className="space-y-3">
          {/* Executive Summary Card */}
          <div className="bg-white/95 border-2 border-[#E4A3D4] rounded-3xl p-4 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#6E497A] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#C295D8]" />
              <span>What this document is about</span>
            </h3>
            <p className="text-xs text-[#3D2347] leading-relaxed">
              {summary.executive_summary}
            </p>

            {/* Core Thesis */}
            {summary.core_thesis && (
              <div className="mt-3 p-3 rounded-2xl bg-[#FCE2DB]/70 border border-[#E4A3D4]">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C295D8] block mb-1">
                  Core Objective / Thesis
                </span>
                <p className="text-xs font-medium text-[#3D2347]">
                  "{summary.core_thesis}"
                </p>
              </div>
            )}
          </div>

          {/* Critical Concepts List */}
          {summary.critical_concepts.length > 0 && (
            <div className="bg-white/95 border-2 border-[#E4A3D4] rounded-3xl p-4 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#6E497A] mb-2.5 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Critical Takeaways &amp; Systems</span>
              </h3>
              <div className="space-y-2">
                {summary.critical_concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#F1C6D3]/40 border border-[#E4A3D4]"
                  >
                    <h4 className="text-xs font-bold text-[#3D2347]">{concept.name}</h4>
                    <p className="text-[11px] text-[#6E497A] mt-1 leading-snug">
                      {concept.significance}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Switch to Terms Hint */}
          <button
            onClick={() => setActiveTab("terms")}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F1C6D3]/60 hover:bg-[#F1C6D3] border border-[#E4A3D4] text-xs font-bold text-[#3D2347] transition flex items-center justify-between"
          >
            <span>Explore {summary.specialized_terms.length} Detected Technical Terms</span>
            <ChevronRight className="w-4 h-4 text-[#C295D8]" />
          </button>
        </div>
      ) : (
        /* Tab 2: Specialized Terms List */
        <div className="bg-white/95 border-2 border-[#E4A3D4] rounded-3xl p-4 shadow-sm space-y-3">
          {/* Sub-Filter Pills */}
          <div className="flex items-center gap-1.5 pb-1 border-b border-[#E4A3D4]/40">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border ${
                filterType === "all"
                  ? "bg-[#C295D8] text-white border-[#B07EC7]"
                  : "bg-white text-[#6E497A] border-[#E4A3D4] hover:bg-[#FCE2DB]"
              }`}
            >
              All ({summary.specialized_terms.length})
            </button>
            <button
              onClick={() => setFilterType("visual")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border flex items-center gap-1 ${
                filterType === "visual"
                  ? "bg-[#C295D8] text-white border-[#B07EC7]"
                  : "bg-white text-[#6E497A] border-[#E4A3D4] hover:bg-[#FCE2DB]"
              }`}
            >
              <Eye className="w-3 h-3" />
              Visual ({summary.visual_terms_count})
            </button>
            <button
              onClick={() => setFilterType("simple")}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition border flex items-center gap-1 ${
                filterType === "simple"
                  ? "bg-[#C295D8] text-white border-[#B07EC7]"
                  : "bg-white text-[#6E497A] border-[#E4A3D4] hover:bg-[#FCE2DB]"
              }`}
            >
              <FileText className="w-3 h-3" />
              Definitions ({summary.simple_terms_count})
            </button>
          </div>

          {/* Term Cards */}
          <div className="space-y-2">
            {filteredTerms.map((term) => {
              const isSelected = selectedTermId === term.id;
              return (
                <div
                  key={term.id}
                  onClick={() => onSelectTerm(term)}
                  className={`p-3 rounded-2xl border-2 transition cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#F1C6D3] border-[#C295D8] shadow-md -translate-y-0.5"
                      : "bg-[#FCE2DB]/40 hover:bg-[#F1C6D3]/60 border-[#E4A3D4]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#6E497A] tracking-wider block">
                        {term.category}
                      </span>
                      <h4 className="text-xs font-black text-[#3D2347]">{term.term}</h4>
                    </div>
                    {term.kind === "visual_concept" ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#C295D8]/20 border border-[#C295D8] text-[9px] font-black text-[#6E497A] flex items-center gap-1 shrink-0">
                        <Eye className="w-2.5 h-2.5 text-[#C295D8]" />
                        Diagram
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-white/80 border border-[#E4A3D4] text-[9px] font-bold text-[#6E497A] shrink-0">
                        Definition
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6E497A] mt-1.5 line-clamp-2">
                    <FormattedText
                      text={term.short_definition}
                      highlightTerms={[term.term]}
                      termClassName="font-black text-[#6E497A]"
                      boldClassName="font-bold text-[#6E497A]"
                    />
                  </p>

                  <div className="mt-2 pt-1.5 border-t border-[#E4A3D4]/50 flex items-center justify-between">
                    <span className="text-[10px] text-[#9469A3] font-semibold">
                      Page {term.page_number || 1}
                    </span>
                    <span className="text-[10px] font-black text-[#C295D8] flex items-center gap-0.5">
                      Inspect in Drawer →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
