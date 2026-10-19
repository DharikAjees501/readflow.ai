"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Info,
} from "lucide-react";
import { PageInfo, SpecializedTerm } from "@/lib/types";
import { ApiClient } from "@/lib/api";
import nlp from "compromise";

interface PdfViewerPanelProps {
  pages: PageInfo[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  specializedTerms: SpecializedTerm[];
  onSelectTerm: (term: SpecializedTerm) => void;
  selectedTermId?: string | null;
  documentId?: string;
}

export const PdfViewerPanel: React.FC<PdfViewerPanelProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
  specializedTerms,
  onSelectTerm,
  selectedTermId,
  documentId,
}) => {
  const [viewMode, setViewMode] = useState<"text" | "rendered">("text");

  const currentPage = pages[currentPageIndex] || null;
  const totalPages = pages.length;

  // Renders text with line-by-line dynamically highlighted clickable terms
  const renderInteractiveText = (rawText: string) => {
    if (!rawText) return <p className="text-[#6E497A] italic text-center py-12">No text found on this page.</p>;

    const cleanText = rawText
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\xa0\u200b\ufeff\ue000-\uf8ff\u{f0000}-\u{fffff}\u{100000}-\u{10ffff}\ufffd]/gu, " ")
      .replace(/[ \t]{2,}/g, " ");

    const lines = cleanText.split("\n");
    const STOPWORDS = new Set(["case", "date", "physician", "md", "page", "to", "from", "medical consultant", "hospital", "patient", "doctor", "report"]);

    const buildPluralStemRegex = (term: string): RegExp => {
      const esc = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let pattern = esc;
      if (/ies$/i.test(term)) {
        pattern = `${esc.slice(0, -3)}(?:y|ies)`;
      } else if (/y$/i.test(term)) {
        pattern = `${esc.slice(0, -1)}(?:y|ies)`;
      } else if (/is$/i.test(term)) {
        pattern = `${esc.slice(0, -2)}(?:is|es|etic)`;
      } else if (/us$/i.test(term)) {
        pattern = `${esc.slice(0, -2)}(?:us|i|ic)`;
      } else if (/um$/i.test(term)) {
        pattern = `${esc.slice(0, -2)}(?:um|a|al)`;
      } else if (/sis$/i.test(term)) {
        pattern = `${esc.slice(0, -3)}(?:sis|ses|tic)`;
      } else if (term.length >= 4 && !/(?:s|x|z|ch|sh)$/i.test(term)) {
        pattern = `${esc}(?:s|es|ed|ing|al|ic)?`;
      }
      return new RegExp(`\\b${pattern}\\b`, "i");
    };

    return (
      <div className="space-y-3 leading-relaxed text-sm sm:text-base text-[#3D2347] tracking-normal font-sans">
        {lines.map((line, lineIdx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={lineIdx} className="h-2" />;

          const candidateMap = new Map<string, string>();

          // A. Match terms from specializedTerms with stem & plural tolerance
          for (const t of specializedTerms) {
            const tClean = t.term.toLowerCase().trim();
            if (tClean.length >= 3 && !STOPWORDS.has(tClean)) {
              const reg = buildPluralStemRegex(t.term);
              const m = trimmed.match(reg);
              if (m) candidateMap.set(m[0].toLowerCase(), m[0]);
            }
          }

          // B. Match multi-word technical collocations (lowercase or capitalized)
          const collocationMatches = trimmed.matchAll(
            /\b((?:coronary|aortic|carotid|pulmonary|mesenteric|renal|femoral|cardiac|myocardial|pericardial|arterial|venous|vascular|ejection|endovascular|mural|deep vein|computed|magnetic|fractional|left ventricular|right ventricular)\s+(?:artery|arteries|vein|veins|vessel|vessels|valve|valves|arch|aneurysm|aneurysms|stenosis|stenoses|thrombus|thrombi|thrombosis|infarction|infarct|ischemia|effusion|calcification|calcifications|flow|perfusion|pressure|fraction|defect|repair|stent|graft|bypass|tomography|resonance|imaging|hypertrophy|plaque|attenuation))\b/gi
          );
          for (const m of collocationMatches) {
            const phrase = m[1].trim();
            const pLow = phrase.toLowerCase();
            if (!candidateMap.has(pLow) && !STOPWORDS.has(pLow)) {
              candidateMap.set(pLow, phrase);
            }
          }

          // C. Match clinical & technical morphological affixes (prefixes & suffixes)
          const affixMatches = trimmed.matchAll(
            /\b((?:hyper|hypo|dys|tachy|brady|micro|macro|anti|intra|inter|sub|supra|extra|endo|peri|epi|retro|trans)[A-Za-z]{3,}|[A-Za-z]{3,}(?:itis|osis|oses|ectomy|emia|aemia|oma|omas|pathy|pathies|gram|grams|graphy|scopy|scopic|plasty|stenosis|stenoses|stenotic|stomy|plasia|trophy|tension|tensive|dynamic|dynamics|vascular|vascularity|ventricular|coronary|aortic|carotid|pulmonary|metric|metrics|ology|ologic|ological|genesis|lysis|lytic|uria|penia|spasm|plegia|pnea|rrhea|rrhage))\b/gi
          );
          for (const m of affixMatches) {
            const w = m[1].trim();
            const wLow = w.toLowerCase();
            if (w.length >= 5 && !candidateMap.has(wLow) && !STOPWORDS.has(wLow)) {
              candidateMap.set(wLow, w);
            }
          }

          // D. Match capitalized technical entities
          const capMatches = trimmed.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g);
          for (const m of capMatches) {
            const p = m[1].trim();
            const pLow = p.toLowerCase();
            if (p.length > 5 && !STOPWORDS.has(pLow)) {
              candidateMap.set(pLow, p);
            }
          }

          // E. Match hyphenated technical concepts
          const hyphenMatches = trimmed.matchAll(/\b([A-Za-z]{3,}-(?:[A-Za-z]{3,}(?:-[A-Za-z]{3,})?))\b/g);
          for (const m of hyphenMatches) {
            const h = m[1].trim();
            const hLow = h.toLowerCase();
            if (h.length >= 6 && !candidateMap.has(hLow) && !STOPWORDS.has(hLow)) {
              candidateMap.set(hLow, h);
            }
          }

          // F. Match technical acronyms
          const acroMatches = trimmed.matchAll(
            /\b(CTA?|CBC|EKG|ECG|BP|AAA|TAA|EF|CAD|MRI|OEE|WACC|DCF|BNP|INR|PT|PTT|LAD|ICA|ECA|CCA|LBBB|RBBB|SVT|AFIB|STEMI|NSTEMI|PCI|CABG|TAVR|TEVAR|EVAR|PAD|COPD|GFR|eGFR|CKD|ESRD|DVT|PE|ARDS|ICU|MAP|CVP|SVR|IVC|SVC|SMA|IMA|LVEF|API|SDK|HTTP|HTTPS|JSON|YAML|SQL|NoSQL|AI|ML|gRPC|DNS|VPC|IAM|RBAC|JWT|CDN|SLA|SLO|CPU|GPU|LLM|NLP)\b/g
          );
          for (const m of acroMatches) {
            candidateMap.set(m[1].toLowerCase(), m[1]);
          }

          // G. Compromise NLP Noun Phrase Identification
          try {
            const docNlp = nlp(trimmed);
            const nouns = docNlp.nouns().out("array");
            for (const rawNoun of nouns) {
              const cleaned = rawNoun
                .replace(/^(?:the|a|an|this|that|these|those)\s+/i, "")
                .replace(/[.,:;!?]+$/g, "")
                .trim();
              const cLow = cleaned.toLowerCase();
              if (
                cleaned.length >= 4 &&
                !candidateMap.has(cLow) &&
                !STOPWORDS.has(cLow)
              ) {
                if (cleaned.includes(" ") || /[a-z]{4,}(?:itis|osis|ectomy|emia|oma|pathy|gram|graphy|plasty|stenosis|tension|trophy|dynamic|vascular)/i.test(cleaned)) {
                  candidateMap.set(cLow, cleaned);
                }
              }
            }
          } catch {
            // Compromise fallback
          }

          const uniqueTerms = Array.from(candidateMap.values()).sort((a, b) => b.length - a.length);
          let lineRegex: RegExp | null = null;
          if (uniqueTerms.length > 0) {
            const escaped = uniqueTerms.map((t) => {
              const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const startB = /^\w/.test(t) ? "\\b" : "";
              const endB = /\w$/.test(t) ? "\\b" : "";
              return `${startB}${esc}${endB}`;
            });
            lineRegex = new RegExp(`(${escaped.join("|")})`, "gi");
          }

          return (
            <p key={lineIdx} className="leading-relaxed">
              {lineRegex ? (
                trimmed.split(lineRegex).map((part, index) => {
                  const partLow = part.toLowerCase().trim();
                  const isMatch = candidateMap.has(partLow);

                  if (isMatch) {
                    const matched = specializedTerms.find((t) => {
                      const tLow = t.term.toLowerCase().trim();
                      return tLow === partLow || buildPluralStemRegex(t.term).test(part);
                    }) || {
                      id: `dyn_${partLow.replace(/[^a-z0-9]/g, "_")}`,
                      term: part,
                      category: "Technical Concept",
                      short_definition: `Technical or clinical term documented in this report: "${trimmed.slice(0, 140)}"`,
                      context_sentence: trimmed,
                      page_number: currentPageIndex + 1,
                      kind: /aneurysm|heart|cardiac|artery|scan|echo|fracture|vessel|stenosis|thrombus|perfusion|effusion/i.test(part) ? "visual_concept" : "simple_concept",
                      importance_score: 4
                    };

                    const isSelected = selectedTermId === matched.id || partLow === (specializedTerms.find(t => t.id === selectedTermId)?.term.toLowerCase());

                    return (
                      <button
                        key={index}
                        onClick={() => onSelectTerm(matched as SpecializedTerm)}
                        className={`term-interactive ${isSelected ? "active-term" : ""}`}
                        title={`Click to inspect '${matched.term}'`}
                      >
                        <span>{part}</span>
                        {matched.kind === "visual_concept" && (
                          <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-[#C295D8] text-white font-bold inline-flex items-center">
                            visual
                          </span>
                        )}
                      </button>
                    );
                  }

                  return <span key={index}>{part}</span>;
                })
              ) : (
                <span>{trimmed}</span>
              )}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFFFFF]/95 border-2 border-[#E4A3D4] rounded-3xl shadow-sm overflow-hidden min-h-[620px] max-h-[calc(100vh-6rem)]">
      {/* Clean Top Toolbar without Zoom controls */}
      <div className="px-5 py-3 border-b-2 border-[#E4A3D4] bg-[#FCE2DB]/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* View Mode Toggle: Interactive Reader vs Original Page PDF */}
        <div className="flex items-center gap-1 bg-white/90 p-1 rounded-2xl border border-[#E4A3D4]">
          <button
            onClick={() => setViewMode("text")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "text"
                ? "bg-[#C295D8] text-white shadow-sm"
                : "text-[#6E497A] hover:bg-[#F1C6D3]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Reader</span>
          </button>
          <button
            onClick={() => setViewMode("rendered")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "rendered"
                ? "bg-[#C295D8] text-white shadow-sm"
                : "text-[#6E497A] hover:bg-[#F1C6D3]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Original PDF View</span>
          </button>
        </div>

        {/* Helpful Prompt for Users */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-[#6E497A] font-semibold bg-[#F1C6D3]/60 px-3 py-1.5 rounded-2xl border border-[#E4A3D4]">
          <Sparkles className="w-3.5 h-3.5 text-[#C295D8]" />
          <span>Click highlighted terms to open definition &amp; diagrams</span>
        </div>

        {/* Page Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(currentPageIndex - 1, 0))}
            disabled={currentPageIndex === 0}
            className="p-1.5 rounded-xl border border-[#E4A3D4] bg-white text-[#3D2347] disabled:opacity-40 hover:bg-[#F1C6D3] transition"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-3 py-1 rounded-xl bg-white border border-[#E4A3D4] text-xs font-bold text-[#3D2347] min-w-[90px] text-center">
            Page {currentPageIndex + 1} of {totalPages || 1}
          </div>
          <button
            onClick={() => onPageChange(Math.min(currentPageIndex + 1, totalPages - 1))}
            disabled={currentPageIndex >= totalPages - 1}
            className="p-1.5 rounded-xl border border-[#E4A3D4] bg-white text-[#3D2347] disabled:opacity-40 hover:bg-[#F1C6D3] transition"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-6 sm:p-10 bg-[#FAF6F4] flex justify-center">
        {viewMode === "text" ? (
          <div className="max-w-3xl w-full bg-white p-8 sm:p-12 rounded-3xl border-2 border-[#E4A3D4]/60 shadow-[0_4px_24px_rgba(228,163,212,0.18)] transition-all">
            {/* Clean Document Page Header (Removed technical PyMuPDF layer jargon) */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E4A3D4]/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C295D8]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#6E497A]">
                  Page {currentPageIndex + 1}
                </span>
              </div>
              <span className="text-xs text-[#9469A3] font-medium">
                {currentPage?.word_count || 0} words
              </span>
            </div>

            {/* Document Content with Selective Highlights */}
            {currentPage ? (
              renderInteractiveText(currentPage.text)
            ) : (
              <p className="text-gray-400 text-center py-10">Loading page...</p>
            )}
          </div>
        ) : (
          /* Original PDF Canvas View */
          <div className="max-w-3xl w-full flex flex-col items-center">
            {documentId ? (
              <img
                src={ApiClient.getPageImageUrl(documentId, currentPageIndex + 1)}
                alt={`PDF Page ${currentPageIndex + 1}`}
                className="w-full rounded-2xl border-2 border-[#E4A3D4] shadow-md object-contain bg-white"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <div className="p-12 text-center text-[#6E497A]">
                No canvas preview available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
