"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Search,
  Eye,
  FileText,
  Activity,
  ExternalLink,
  Download,
  ChevronLeft,
  ChevronRight,
  Globe,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  UploadCloud,
  Trash2,
} from "lucide-react";
import { PageInfo, SpecializedTerm, DeepSearchResponse, VisualGenerateResponse, TranslationResponse } from "@/lib/types";
import { ApiClient } from "@/lib/api";
import nlp from "compromise";

interface ScanslatedViewProps {
  pages: PageInfo[];
  currentPageIndex: number;
  onPageChange: (index: number) => void;
  specializedTerms: SpecializedTerm[];
  selectedTerm: SpecializedTerm | null;
  onSelectTerm: (term: SpecializedTerm) => void;
  onCloseCard: () => void;
  documentTitle: string;
  documentDate?: string;
  domain?: string;
  documentId?: string;
  onOpenUpload?: () => void;
  onDeleteDocument?: () => void;
  isDeleting?: boolean;
}

export const ScanslatedView: React.FC<ScanslatedViewProps> = ({
  pages,
  currentPageIndex,
  onPageChange,
  specializedTerms,
  selectedTerm,
  onSelectTerm,
  onCloseCard,
  documentTitle,
  documentDate,
  domain,
  documentId,
  onOpenUpload,
  onDeleteDocument,
  isDeleting,
}) => {
  const [viewMode, setViewMode] = useState<"interactive" | "canvas">("interactive");
  const [simplifiedExplanation, setSimplifiedExplanation] = useState<boolean>(true);

  // On-demand search & visual states for the active card
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchData, setSearchData] = useState<DeepSearchResponse | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [visualLoading, setVisualLoading] = useState(false);
  const [visualData, setVisualData] = useState<VisualGenerateResponse | null>(null);
  const [visualError, setVisualError] = useState<string | null>(null);
  const [isFullImageOpen, setIsFullImageOpen] = useState(false);

  // Multi-Language Translation States
  const [selectedLanguage, setSelectedLanguage] = useState<string>("english");
  const [translationLoading, setTranslationLoading] = useState<boolean>(false);
  const [translatedData, setTranslatedData] = useState<TranslationResponse | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Automatically trigger web search answer as soon as a term is selected
  React.useEffect(() => {
    setSearchData(null);
    setSearchError(null);
    setVisualData(null);
    setVisualError(null);
    setVisualLoading(false);
    setIsFullImageOpen(false);
    setSelectedLanguage("english");
    setTranslatedData(null);
    setTranslationError(null);
    setTranslationLoading(false);

    if (selectedTerm) {
      setSearchLoading(true);
      ApiClient.triggerDeepSearch(selectedTerm.term, domain, selectedTerm.context_sentence)
        .then((res) => {
          setSearchData(res);
        })
        .catch((err: any) => {
          setSearchError(err?.message || "Failed to retrieve search insights.");
        })
        .finally(() => {
          setSearchLoading(false);
        });
    } else {
      setSearchLoading(false);
    }
  }, [selectedTerm?.id, selectedTerm?.term]);

  const handleLanguageChange = async (lang: string) => {
    setSelectedLanguage(lang);
    setTranslationError(null);

    if (lang === "english") {
      setTranslatedData(null);
      return;
    }

    if (!selectedTerm) return;

    setTranslationLoading(true);
    try {
      const summaryToTranslate = searchData?.summary || selectedTerm.short_definition || "";
      const findingsToTranslate = searchData?.key_findings || [];
      const res = await ApiClient.translateTerm(
        selectedTerm.term,
        lang,
        summaryToTranslate,
        findingsToTranslate,
        selectedTerm.context_sentence,
        domain
      );
      setTranslatedData(res);
    } catch (err: any) {
      console.error("Translation error:", err);
      setTranslationError(err?.message || "Failed to translate explanation.");
    } finally {
      setTranslationLoading(false);
    }
  };

  const currentPage = pages[currentPageIndex] || null;
  const totalPages = pages.length;

  const handleGenerateVisual = async () => {
    if (!selectedTerm) return;
    setVisualLoading(true);
    setVisualError(null);
    try {
      const richDefinition = searchData?.summary || selectedTerm.short_definition || "";
      const res = await ApiClient.triggerVisualGeneration(
        selectedTerm.term,
        domain,
        richDefinition,
        undefined,
        selectedTerm.context_sentence
      );
      setVisualData(res);
    } catch (err: any) {
      setVisualError(err?.message || "Failed to generate diagram.");
    } finally {
      setVisualLoading(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!visualData || !selectedTerm) return;
    const blob = new Blob([visualData.svg_code], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTerm.term.replace(/\s+/g, "_")}_diagram.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = async () => {
    if (!visualData || !selectedTerm) return;
    try {
      const svgString = visualData.svg_code;
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const width = 1080;
        const height = 760;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#FCE2DB";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `${selectedTerm.term.replace(/\s+/g, "_")}_accurate_schematic.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch (err) {
      console.error("Failed to export PNG:", err);
    }
  };

  const STOPWORDS = new Set([
    "case", "date", "physician", "md", "page", "to", "from", "medical consultant", "hospital",
    "patient", "year", "old", "doctor", "report", "summary", "note", "consultant", "august",
    "september", "october", "november", "december", "january", "february", "march", "april",
    "may", "june", "july", "mr", "mrs", "dr", "ms", "the patient", "she was", "on his",
    "had the", "there are", "in conclusion", "in other words", "the complaint", "the cardiologist",
    "on her", "he was", "due to", "in addition", "she did", "she had", "however", "when the",
    "i conclude", "i do believe", "statement", "practioner", "therefore", "she was to be",
    "she presented", "who presented", "determined that", "because of", "ordered a",
    "history", "clinical history", "technique", "findings", "impression", "assessment", "plan",
    "conclusion", "indication", "procedure", "diagnosis", "recommendation", "discussion",
    "exam", "examination", "consultation", "introduction", "methods", "results"
  ]);

  const CLINICAL_DEFINITIONS: Record<string, string> = {
    syncope: "Temporary loss of consciousness caused by a momentary drop in blood flow and oxygen delivery to the brain (fainting).",
    hypertension: "Chronic high blood pressure causing excessive mechanical wall stress and remodeling across the arterial tree.",
    hypotension: "Abnormally low blood pressure that may reduce perfusion to the brain and other vital organs.",
    aneurysm: "An abnormal ballooning or dilation in the weakened wall of an artery that requires continuous monitoring or surgical repair.",
    stenosis: "Abnormal narrowing of a blood vessel lumen or valve orifice restricting forward blood flow and tissue perfusion.",
    calcification: "Hardened calcium phosphate deposits within vascular walls indicating advanced atherosclerosis and stiffened compliance.",
    thrombus: "A localized blood clot adhering to the vessel endothelium that can obstruct flow or dislodge as an embolus.",
    thrombosis: "The formation or presence of a blood clot within a blood vessel obstructing normal circulation.",
    atherosclerosis: "A chronic inflammatory disease characterized by lipid-rich plaque buildup within the intima of medium and large arteries.",
    ischemia: "Inadequate blood supply to a tissue or organ causing a shortage of oxygen and glucose needed for cellular metabolism.",
    infarction: "Tissue death (necrosis) caused by an obstruction of the local blood supply, such as in a myocardial infarction.",
    dysplasia: "Abnormal development or growth of cells, tissues, or vascular structures such as fibromuscular dysplasia.",
    effusion: "An abnormal accumulation of fluid in an anatomical space, such as pericardial effusion around the heart.",
    arrhythmia: "Any disturbance or abnormality in the normal rhythmic beating pattern or rate of the heart.",
    tachycardia: "An abnormally rapid resting heart rate, typically exceeding 100 beats per minute.",
    bradycardia: "An abnormally slow resting heart rate, typically slower than 60 beats per minute.",
    cardiomyopathy: "Disease of the heart muscle that makes it harder for the heart to pump blood to the rest of the body.",
    endovascular: "A minimally invasive surgical technique accessing the interior of blood vessels through micro-catheters and stents.",
    angioplasty: "A surgical procedure to restore blood flow through the artery using a balloon catheter or stent.",
    troponin: "A group of cardiac proteins released into the bloodstream when heart muscle cells suffer ischemic damage or injury.",
    creatinine: "A chemical waste product in the blood filtered by healthy kidneys, used to measure renal glomerular function.",
    latency: "The time delay between sending a request and receiving the response across a network or computational system.",
    throughput: "The volume of data, requests, or transactions processed successfully within a specified time window.",
    concurrency: "The execution of multiple computations or tasks simultaneously through task interleaving or parallel processing.",
    asynchronous: "A form of processing where tasks execute independently of the main program flow without blocking threads.",
    idempotency: "A mathematical or system property where an operation can be applied multiple times without altering the final result beyond the initial application.",
    microservices: "An architectural pattern structuring an application as a collection of loosely coupled, independently deployable services.",
    kubernetes: "An open-source container orchestration system for automating application deployment, scaling, and management."
  };

  // Comprehensive Domain Vocabulary Catalog
  const DOMAIN_KEYWORDS = [
    // Vascular & Cardiovascular Pathology & Anatomy
    "syncope", "hypertension", "hypotension", "aneurysm", "aneurysms", "aneurysmal",
    "thrombus", "thrombi", "thrombosis", "thrombotic", "stenosis", "stenoses", "stenotic",
    "calcification", "calcifications", "calcified", "ischemia", "ischemic", "infarction",
    "infarctions", "dysplasia", "atherosclerosis", "atherosclerotic", "atheroma", "effusion",
    "cardiomegaly", "arrhythmia", "arrhythmias", "tachycardia", "bradycardia", "cardiomyopathy",
    "pericardium", "pericardial", "myocardium", "myocardial", "endocardium", "endothelial",
    "aorta", "aortic", "carotid", "coronary", "artery", "arteries", "arterial", "arteriole",
    "vein", "veins", "venous", "endovascular", "stent", "stents", "bypass", "graft", "grafts",
    "embolus", "emboli", "embolism", "perfusion", "fibrillation", "valvulopathy", "ventricle",
    "ventricles", "ventricular", "atrium", "atria", "atrial", "systole", "systolic", "diastole",
    "diastolic", "troponin", "creatinine", "hemodynamic", "hemodynamics", "fibromuscular dysplasia",
    "atherosclerotic stenosis", "aortic aneurysm", "pericardial effusion", "mural thrombus",
    "peripheral calcification", "ejection fraction", "cardiac silhouette", "endovascular repair",
    "mesenteric artery", "celiac axis", "renal arteries", "deep vein thrombosis",
    "coronary artery disease", "myocardial infarction", "pulmonary embolism", "contrast enhancement",
    "wall thickening", "filling defect", "soft tissue attenuation", "fractional flow reserve",
    // Diagnostics, Neurology & Pharmacology
    "neuropathy", "radiculopathy", "nephropathy", "retinopathy", "hyperlipidemia", "dyslipidemia",
    "angioplasty", "endarterectomy", "echocardiogram", "echocardiography", "angiography",
    "tomography", "computed tomography", "magnetic resonance", "scintigraphy", "fluoroscopy",
    "metoprolol", "lisinopril", "atorvastatin", "amlodipine", "warfarin", "apixaban", "heparin",
    "clopidogrel", "aspirin", "furosemide", "losartan", "platelet", "platelets", "hematocrit",
    "hemoglobin", "catheter", "catheterization", "edema", "lesion", "lesions", "biopsy",
    "sepsis", "vasodilation", "vasoconstriction", "intravenous contrast", "dyspnea", "hypoxemia",
    "hypercapnia", "atelectasis", "consolidation", "pneumothorax", "pleural effusion",
    "pulmonary edema", "emphysema", "fibrosis", "bronchospasm", "pneumonitis", "infiltrate",
    // Software, Cloud & System Architecture
    "latency", "latencies", "throughput", "concurrency", "asynchronous", "synchronous",
    "idempotency", "microservices", "microservice", "kubernetes", "docker", "container",
    "containerization", "cluster", "clusters", "cache", "caching", "redis", "telemetry",
    "pipeline", "pipelines", "middleware", "payload", "sharding", "replication", "consensus",
    "circuit breaker", "schema", "transaction", "transactions", "deadlock", "mutex",
    "semaphore", "serialization", "deserialization", "scalability", "failover", "redundancy",
    "load balancer", "ingress", "egress", "rate limiting", "backpressure", "event loop",
    // Mathematics, Statistics & Applied Science
    "eigenvalue", "eigenvalues", "eigenvector", "eigenvectors", "covariance", "correlation",
    "distribution", "gaussian", "poisson", "stochastic", "markov chain", "gradient descent",
    "singular value decomposition", "bayesian", "hyperparameter", "differential equation",
    "fourier transform", "hamiltonian", "thermodynamic", "spectroscopy"
  ];

  // Builds an inflection and plural-tolerant regex for matching words line-by-line
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

  // Resolves or creates a SpecializedTerm object for any word or phrase on any line
  const resolveTermObject = (token: string, lineText: string): SpecializedTerm => {
    const low = token.toLowerCase().trim();

    // 1. Check if backend already has this exact or stem-matched term
    const fromBackend = specializedTerms.find((t) => {
      const bLow = t.term.toLowerCase().trim();
      return bLow === low || buildPluralStemRegex(t.term).test(token);
    });
    if (fromBackend) return fromBackend;

    // 2. Check local definitions dictionary or document context
    const definition = CLINICAL_DEFINITIONS[low] ||
      `Document context: "${lineText.slice(0, 150)}"`;

    const isVis = /aneurysm|heart|cardiac|artery|aorta|scan|echo|fracture|hematoma|proxy|gateway|architecture|graph|vessel|stenosis|thrombus|valve|cluster|cache|conduction|catheter|effusion|perfusion/i.test(token);
    return {
      id: `dyn_${low.replace(/[^a-z0-9]/g, "_")}`,
      term: token,
      category: "Specialized Concept",
      short_definition: definition,
      context_sentence: lineText,
      page_number: currentPageIndex + 1,
      kind: isVis ? "visual_concept" : "simple_concept",
      importance_score: 4,
    };
  };

  // Helper to render interactive terms inline within any text node
  const renderInlineTerms = (text: string, contextSentence: string, blockKey: string | number) => {
    if (!text) return null;

    // Dynamic line-by-line concept identification
    const candidateMap = new Map<string, string>(); // lowercase -> original matched string

    // A. Scan line for backend specialized terms (with stem & plural awareness)
    for (const t of specializedTerms) {
      const tLow = t.term.toLowerCase().trim();
      if (tLow.length >= 3 && !STOPWORDS.has(tLow)) {
        const reg = buildPluralStemRegex(t.term);
        const m = text.match(reg);
        if (m) {
          candidateMap.set(m[0].toLowerCase(), m[0]);
        }
      }
    }

    // B. Scan line for clinical & technical domain vocabulary (with stem & plural awareness)
    for (const word of DOMAIN_KEYWORDS) {
      const wLow = word.toLowerCase();
      if (!candidateMap.has(wLow) && !STOPWORDS.has(wLow)) {
        const reg = buildPluralStemRegex(word);
        const m = text.match(reg);
        if (m) {
          candidateMap.set(m[0].toLowerCase(), m[0]);
        }
      }
    }

    // C. Scan line for multi-word technical collocations (lowercase or capitalized)
    const collocationMatches = text.matchAll(
      /\b((?:coronary|aortic|carotid|pulmonary|mesenteric|renal|femoral|cardiac|myocardial|pericardial|arterial|venous|vascular|ejection|endovascular|mural|deep vein|computed|magnetic|fractional|left ventricular|right ventricular|server|proxy|gateway|reverse proxy|load balancer|rate limiter|microservice|distributed|consensus|cache|pipeline)\s+(?:artery|arteries|vein|veins|vessel|vessels|valve|valves|arch|aneurysm|aneurysms|stenosis|stenoses|thrombus|thrombi|thrombosis|infarction|infarct|ischemia|effusion|calcification|calcifications|flow|perfusion|pressure|fraction|defect|repair|stent|graft|bypass|tomography|resonance|imaging|hypertrophy|plaque|attenuation|gateway|cluster|protocol|service|services|engine|database|interface|token))\b/gi
    );
    for (const m of collocationMatches) {
      const phrase = m[1].trim();
      const pLow = phrase.toLowerCase();
      if (!candidateMap.has(pLow) && !STOPWORDS.has(pLow)) {
        candidateMap.set(pLow, phrase);
      }
    }

    // D. Scan line for clinical & technical morphological affixes (prefixes & suffixes)
    const affixMatches = text.matchAll(
      /\b((?:hyper|hypo|dys|tachy|brady|micro|macro|anti|intra|inter|sub|supra|extra|endo|peri|epi|retro|trans)[A-Za-z]{3,}|[A-Za-z]{3,}(?:itis|osis|oses|ectomy|emia|aemia|oma|omas|pathy|pathies|gram|grams|graphy|scopy|scopic|plasty|stenosis|stenoses|stenotic|stomy|plasia|trophy|tension|tensive|dynamic|dynamics|vascular|vascularity|ventricular|coronary|aortic|carotid|pulmonary|metric|metrics|ology|ologic|ological|genesis|lysis|lytic|uria|penia|spasm|plegia|pnea|rrhea|rrhage))\b/gi
    );
    for (const m of affixMatches) {
      const w = m[1].trim();
      const wLow = w.toLowerCase();
      if (w.length >= 5 && !candidateMap.has(wLow) && !STOPWORDS.has(wLow)) {
        candidateMap.set(wLow, w);
      }
    }

    // E. Scan line for capitalized multi-word technical entities
    const capMatches = text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/g);
    for (const m of capMatches) {
      const phrase = m[1].trim();
      const pLow = phrase.toLowerCase();
      if (phrase.length > 5 && !candidateMap.has(pLow) && !STOPWORDS.has(pLow) && !Array.from(STOPWORDS).some((s) => pLow.startsWith(s))) {
        candidateMap.set(pLow, phrase);
      }
    }

    // F. Scan line for hyphenated technical compounds
    const hyphenMatches = text.matchAll(/\b([A-Za-z]{3,}-(?:[A-Za-z]{3,}(?:-[A-Za-z]{3,})?))\b/g);
    for (const m of hyphenMatches) {
      const h = m[1].trim();
      const hLow = h.toLowerCase();
      if (h.length >= 6 && !candidateMap.has(hLow) && !STOPWORDS.has(hLow)) {
        candidateMap.set(hLow, h);
      }
    }

    // G. Scan line for technical & clinical acronyms
    const acroMatches = text.matchAll(
      /\b(CTA?|CBC|EKG|ECG|BP|AAA|TAA|EF|CAD|MRI|OEE|WACC|DCF|BNP|INR|PT|PTT|LAD|ICA|ECA|CCA|LBBB|RBBB|SVT|AFIB|STEMI|NSTEMI|PCI|CABG|TAVR|TEVAR|EVAR|PAD|COPD|GFR|eGFR|CKD|ESRD|DVT|PE|ARDS|ICU|MAP|CVP|SVR|IVC|SVC|SMA|IMA|LVEF|API|SDK|HTTP|HTTPS|JSON|YAML|SQL|NoSQL|AI|ML|gRPC|DNS|VPC|IAM|RBAC|JWT|CDN|SLA|SLO|CPU|GPU|LLM|NLP)\b/g
    );
    for (const m of acroMatches) {
      candidateMap.set(m[1].toLowerCase(), m[1]);
    }

    // H. Compromise NLP Noun Phrase Identification
    try {
      const docNlp = nlp(text);
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
          !STOPWORDS.has(cLow) &&
          !Array.from(STOPWORDS).some((s) => cLow === s || cLow.startsWith(`${s} `))
        ) {
          if (cleaned.includes(" ") || /[a-z]{4,}(?:itis|osis|ectomy|emia|oma|pathy|gram|graphy|plasty|stenosis|tension|trophy|dynamic|vascular|proxy|gateway|server|database)/i.test(cleaned)) {
            candidateMap.set(cLow, cleaned);
          }
        }
      }
    } catch {
      // fallback
    }

    // Deduplicate and sort longest phrase first
    const uniqueTerms = Array.from(candidateMap.values()).sort((a, b) => b.length - a.length);

    if (uniqueTerms.length === 0) {
      return <span>{text}</span>;
    }

    const escaped = uniqueTerms.map((t) => {
      const esc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const startB = /^\w/.test(t) ? "\\b" : "";
      const endB = /\w$/.test(t) ? "\\b" : "";
      return `${startB}${esc}${endB}`;
    });
    const lineRegex = new RegExp(`(${escaped.join("|")})`, "gi");

    return (
      <>
        {text.split(lineRegex).map((part, pIdx) => {
          const partLow = part.toLowerCase().trim();
          const isMatch = candidateMap.has(partLow);

          if (isMatch) {
            const termObj = resolveTermObject(part, contextSentence || text);
            const isSelected = selectedTerm?.term.toLowerCase() === partLow;

            if (isSelected) {
              return (
                <span key={`${blockKey}-${pIdx}`} className="relative inline-flex items-center mx-0.5">
                  <button
                    onClick={() => onSelectTerm(termObj)}
                    className="scanslated-term-active"
                    title={`Active: '${part}'`}
                  >
                    <span>{part}</span>
                    <span className="text-[10px] ml-0.5 opacity-90">◀</span>
                  </button>
                </span>
              );
            }

            const isTeal = pIdx % 2 === 0;
            return (
              <button
                key={`${blockKey}-${pIdx}`}
                onClick={() => onSelectTerm(termObj)}
                className={isTeal ? "scanslated-term-underlined-teal" : "scanslated-term-underlined-purple"}
                title={`Click to inspect explanation for '${part}'`}
              >
                {part}
              </button>
            );
          }

          return <span key={`${blockKey}-${pIdx}`}>{part}</span>;
        })}
      </>
    );
  };

  // Parses document lines and renders structured, beautiful, understandable blocks with distinct headers & subheadings
  const renderDocumentContent = (page: PageInfo | null) => {
    if (!page || (!page.blocks?.length && !page.text)) {
      return <p className="text-gray-400 italic py-8 text-center">No text content available on this page.</p>;
    }

    // 1. If structured blocks already exist from backend extraction, render them directly
    if (page.blocks && page.blocks.length > 0) {
      return (
        <div className="scanslated-content-flow space-y-1 text-[#1E293B] font-sans">
          {page.blocks.map((block, bIdx) => {
            if (block.type === "title") {
              return (
                <div key={bIdx} className="pt-2 pb-3 mb-5 border-b-2 border-purple-200">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight leading-snug">
                    {renderInlineTerms(block.text, block.text, bIdx)}
                  </h1>
                </div>
              );
            }

            if (block.type === "heading") {
              return (
                <div key={bIdx} className="mt-7 mb-3 pt-2">
                  <h2 className="text-lg sm:text-xl font-black text-[#312B6B] flex items-center gap-2.5 border-l-4 border-[#7C3AED] pl-3.5 py-1 bg-gradient-to-r from-purple-100/60 to-transparent rounded-r-xl shadow-xs">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED] rotate-45 shrink-0" />
                    <span>{renderInlineTerms(block.text, block.text, bIdx)}</span>
                  </h2>
                </div>
              );
            }

            if (block.type === "subheading") {
              return (
                <div key={bIdx} className="mt-5 mb-2">
                  <h3 className="text-[16px] font-extrabold text-[#1E293B] flex items-center gap-2 text-purple-950">
                    <span className="w-2 h-2 rounded-full bg-[#2DD4BF] shrink-0" />
                    <span>{renderInlineTerms(block.text, block.text, bIdx)}</span>
                  </h3>
                </div>
              );
            }

            if (block.type === "key_value") {
              return (
                <div key={bIdx} className="my-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-100/90 flex flex-wrap items-baseline gap-2.5 shadow-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white font-black text-[11px] uppercase tracking-wider shrink-0 shadow-sm">
                    {block.key || "Section"}
                  </span>
                  <span className="text-[14px] sm:text-[15px] text-[#334155] font-medium leading-relaxed">
                    {renderInlineTerms(block.value || block.text, block.text, bIdx)}
                  </span>
                </div>
              );
            }

            if (block.type === "list_item") {
              return (
                <div key={bIdx} className="flex items-start gap-3 my-2 pl-3">
                  <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2 shrink-0 shadow-xs" />
                  <div className="text-[15px] text-[#334155] leading-relaxed flex-1">
                    {renderInlineTerms(block.text, block.text, bIdx)}
                  </div>
                </div>
              );
            }

            return (
              <p key={bIdx} className="text-[15px] text-[#334155] leading-relaxed font-normal mb-3.5">
                {renderInlineTerms(block.text, block.text, bIdx)}
              </p>
            );
          })}
        </div>
      );
    }

    // 2. Intelligent fallback parser for raw text (e.g. documents without pre-computed blocks)
    const cleanText = page.text
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\xa0\u200b\ufeff\ue000-\uf8ff\u{f0000}-\u{fffff}\u{100000}-\u{10ffff}\ufffd]/gu, " ")
      .replace(/[ \t]{2,}/g, " ");

    const rawParagraphs = cleanText.split(/\n\s*\n/).filter((p) => p.trim());

    return (
      <div className="scanslated-content-flow space-y-1 text-[#1E293B] font-sans">
        {rawParagraphs.map((para, pIdx) => {
          const trimmed = para.trim();
          if (!trimmed) return null;

          // Check if markdown-style heading
          if (trimmed.startsWith("# ")) {
            const hText = trimmed.replace(/^#\s+/, "");
            return (
              <div key={pIdx} className="pt-2 pb-3 mb-5 border-b-2 border-purple-200">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight leading-snug">
                  {renderInlineTerms(hText, hText, pIdx)}
                </h1>
              </div>
            );
          }

          if (trimmed.startsWith("## ")) {
            const hText = trimmed.replace(/^##\s+/, "");
            return (
              <div key={pIdx} className="mt-7 mb-3 pt-2">
                <h2 className="text-lg sm:text-xl font-black text-[#312B6B] flex items-center gap-2.5 border-l-4 border-[#7C3AED] pl-3.5 py-1 bg-gradient-to-r from-purple-100/60 to-transparent rounded-r-xl shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED] rotate-45 shrink-0" />
                  <span>{renderInlineTerms(hText, hText, pIdx)}</span>
                </h2>
              </div>
            );
          }

          if (trimmed.startsWith("### ")) {
            const hText = trimmed.replace(/^###\s+/, "");
            return (
              <div key={pIdx} className="mt-5 mb-2">
                <h3 className="text-[16px] font-extrabold text-[#1E293B] flex items-center gap-2 text-purple-950">
                  <span className="w-2 h-2 rounded-full bg-[#2DD4BF] shrink-0" />
                  <span>{renderInlineTerms(hText, hText, pIdx)}</span>
                </h3>
              </div>
            );
          }

          // Check for numbered section headers e.g. "1. Executive Summary"
          const numMatch = trimmed.match(/^(\d+(?:\.\d+)*\.?\s+[A-Za-z0-9\s&/\-_]{3,60}:?)(?:\s+([\s\S]*))?$/);
          if (numMatch && (!numMatch[2] || numMatch[1].length < 50)) {
            const hTitle = numMatch[1].replace(/:$/, "").trim();
            const rest = (numMatch[2] || "").trim();
            return (
              <div key={pIdx} className="mt-7 mb-3 pt-2">
                <h2 className="text-lg sm:text-xl font-black text-[#312B6B] flex items-center gap-2.5 border-l-4 border-[#7C3AED] pl-3.5 py-1 bg-gradient-to-r from-purple-100/60 to-transparent rounded-r-xl shadow-xs">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#7C3AED] rotate-45 shrink-0" />
                  <span>{renderInlineTerms(hTitle, hTitle, pIdx)}</span>
                </h2>
                {rest && (
                  <p className="text-[15px] text-[#334155] leading-relaxed font-normal mt-2.5 mb-3.5">
                    {renderInlineTerms(rest, rest, `${pIdx}-rest`)}
                  </p>
                )}
              </div>
            );
          }

          // Check for Key-Value pairs e.g. "Case: MD 09" or "FINDINGS: ..."
          const kvMatch = trimmed.match(/^([A-Za-z0-9\s&/\-_]{2,30}):\s+([\s\S]+)$/);
          if (kvMatch && kvMatch[1].length < 28 && trimmed.length < 160) {
            return (
              <div key={pIdx} className="my-2.5 p-3 rounded-xl bg-purple-50/70 border border-purple-100/90 flex flex-wrap items-baseline gap-2.5 shadow-xs">
                <span className="px-2.5 py-1 rounded-lg bg-[#7C3AED] text-white font-black text-[11px] uppercase tracking-wider shrink-0 shadow-sm">
                  {kvMatch[1].trim()}
                </span>
                <span className="text-[14px] sm:text-[15px] text-[#334155] font-medium leading-relaxed">
                  {renderInlineTerms(kvMatch[2].trim(), trimmed, pIdx)}
                </span>
              </div>
            );
          }

          // Check for bullet list item
          if (trimmed.startsWith("● ") || trimmed.startsWith("• ") || trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const listText = trimmed.replace(/^[●•\-*]\s+/, "");
            return (
              <div key={pIdx} className="flex items-start gap-3 my-2 pl-3">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED] mt-2 shrink-0 shadow-xs" />
                <div className="text-[15px] text-[#334155] leading-relaxed flex-1">
                  {renderInlineTerms(listText, trimmed, pIdx)}
                </div>
              </div>
            );
          }

          // Normal Paragraph (smooth word flow)
          const singleLinePara = trimmed.replace(/\n+/g, " ");
          return (
            <p key={pIdx} className="text-[15px] text-[#334155] leading-relaxed font-normal mb-3.5">
              {renderInlineTerms(singleLinePara, singleLinePara, pIdx)}
            </p>
          );
        })}
      </div>
    );
  };

  const getPlainEnglishDescription = (t: SpecializedTerm): { lead: string; mechanics: string } => {
    return {
      lead: t.short_definition || `A critical specialized construct evaluated in this document context.`,
      mechanics: t.context_sentence
        ? `Document Context: "${t.context_sentence}"`
        : `Categorized under ${t.category || "Domain Concept"}.`,
    };
  };

  const desc = selectedTerm ? getPlainEnglishDescription(selectedTerm) : null;

  return (
    <div className="w-full h-full flex flex-col gap-3 min-h-0">
      {/* Page Toolbar (Static Top Bar - Always Visible) */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 bg-white/95 border border-[#E4A3D4] px-5 py-2.5 rounded-2xl shadow-sm z-10">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-[#FCE2DB]/70 p-1 rounded-xl border border-[#E4A3D4]">
          <button
            onClick={() => setViewMode("interactive")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "interactive"
                ? "bg-[#C295D8] text-white shadow-sm"
                : "text-[#6E497A] hover:bg-white/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Interactive Document</span>
          </button>
          <button
            onClick={() => setViewMode("canvas")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === "canvas"
                ? "bg-[#C295D8] text-white shadow-sm"
                : "text-[#6E497A] hover:bg-white/60"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Original PDF Canvas</span>
          </button>
        </div>

        {/* Right Actions: Page Navigation & Document Controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
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

          {(onOpenUpload || onDeleteDocument) && (
            <div className="h-5 w-px bg-[#E4A3D4]/70 mx-1 hidden sm:block" />
          )}

          {/* Upload New PDF Button */}
          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="pastel-btn px-3.5 py-1.5 text-xs rounded-xl flex items-center gap-1.5 shadow-[0_2px_0_#9E6CB7]"
              title="Upload PDF"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Upload PDF</span>
            </button>
          )}

          {/* Delete Active Document Button */}
          {onDeleteDocument && (
            <button
              onClick={onDeleteDocument}
              disabled={isDeleting}
              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              title="Delete Active Document"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Two-Panel Layout: Independent Scrollable Document on Left, Anchored Card on Right */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-hidden">
        {/* Left Column: Scrollable Document View */}
        <div
          className={`${
            selectedTerm ? "lg:col-span-7 xl:col-span-8" : "lg:col-span-12"
          } transition-all duration-300 h-full overflow-y-auto pr-2 pb-6 custom-scrollbar`}
        >
          <div className="scanslated-doc p-8 sm:p-12 min-h-full bg-white">
            {/* Header with Circular Purple Icon, Bold Title, Date & Dotted Line */}
            <div className="flex items-start gap-4 pb-6 mb-6 border-b border-dashed border-gray-300">
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] flex items-center justify-center text-white shadow-md shrink-0">
                <Activity className="w-6 h-6 text-purple-100" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight leading-tight">
                  {documentTitle || "Uploaded Learning Document"}
                </h1>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-[#64748B] font-medium">
                  <span>{documentDate || "Active Document"}</span>
                  {domain && (
                    <>
                      <span>•</span>
                      <span className="font-bold text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        {domain}
                      </span>
                    </>
                  )}
                  <span>•</span>
                  <span>{currentPage?.word_count || 0} words on page</span>
                </div>
              </div>
            </div>

            {/* Document Content */}
            {viewMode === "interactive" ? (
              currentPage ? (
                renderDocumentContent(currentPage)
              ) : (
                <p className="text-gray-400 text-center py-12">Loading page content...</p>
              )
            ) : (
              /* Canvas View */
              <div className="flex justify-center">
                {documentId ? (
                  <img
                    src={ApiClient.getPageImageUrl(documentId, currentPageIndex + 1)}
                    alt={`Page ${currentPageIndex + 1}`}
                    className="w-full rounded-xl border border-gray-200 shadow-sm object-contain"
                  />
                ) : (
                  <p className="text-gray-400 py-12">Canvas not available</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Anchored Scanslated Card with Independent Scroll */}
        <AnimatePresence>
          {selectedTerm && (
            <motion.div
              initial={{ opacity: 0, x: 25, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 25, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="lg:col-span-5 xl:col-span-4 h-full overflow-y-auto pr-1 pb-6 custom-scrollbar"
            >
              <div className="scanslated-card p-6 shadow-2xl relative">
                {/* Header: Term in Light Cyan with Close Button */}
                <div className="flex items-start justify-between gap-3 pb-3 mb-4 border-b border-white/15">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#2DD4BF] tracking-tight lowercase">
                      {translatedData && selectedLanguage !== "english" ? translatedData.translated_term : selectedTerm.term}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-purple-200 uppercase tracking-wider font-bold">
                        {selectedTerm.category || "Technical Feature"}
                      </span>
                      {selectedLanguage !== "english" && (
                        <span className="text-[10px] bg-[#2DD4BF]/20 text-[#2DD4BF] px-2 py-0.5 rounded-full font-bold border border-[#2DD4BF]/30">
                          {translatedData?.target_language_label || selectedLanguage.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onCloseCard}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body: Web-Searched & Grounded Explanation (Instant on Click) */}
                <div className="space-y-4">
                  {/* Loading State: Retrieving Live Web Search */}
                  {searchLoading && (
                    <div className="py-6 px-4 rounded-2xl bg-black/20 border border-white/10 flex flex-col items-center justify-center gap-3 text-center animate-pulse">
                      <div className="w-6 h-6 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-white">Synthesizing live web &amp; academic search insights...</p>
                        <p className="text-[11px] text-purple-200">Consulting scholarly publications and authoritative knowledge bases for '{selectedTerm.term}'</p>
                      </div>
                    </div>
                  )}

                  {/* Translation Loading State */}
                  {translationLoading && (
                    <div className="py-3 px-4 rounded-xl bg-black/20 border border-[#2DD4BF]/30 flex items-center justify-center gap-2.5 text-center animate-pulse">
                      <div className="w-4 h-4 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin shrink-0" />
                      <p className="text-xs font-semibold text-[#2DD4BF]">
                        Translating explanation into {selectedLanguage.toUpperCase()} with domain precision...
                      </p>
                    </div>
                  )}

                  {/* Main Web-Searched Explanation & Key Findings */}
                  {searchData && !searchLoading && (
                    <div className="space-y-3.5">
                      <div className="text-sm sm:text-[14.5px] text-white/95 leading-relaxed font-sans bg-white/5 p-4 rounded-2xl border border-white/10 shadow-sm">
                        <p className="leading-relaxed font-normal">
                          {translatedData && selectedLanguage !== "english"
                            ? translatedData.translated_summary
                            : searchData.summary}
                        </p>
                      </div>

                      {/* Document Context Quote Callout */}
                      {selectedTerm.context_sentence && (
                        <div className="text-xs sm:text-[13px] text-purple-100/90 leading-relaxed italic bg-black/20 p-3 rounded-xl border border-white/10">
                          <span className="font-bold text-cyan-200 not-italic block mb-0.5 text-[10px] uppercase tracking-wider">
                            Source Document Context:
                          </span>
                          "{translatedData && selectedLanguage !== "english" && translatedData.context_translation
                            ? translatedData.context_translation
                            : selectedTerm.context_sentence}"
                        </div>
                      )}

                      {/* Key Analytical Findings */}
                      {searchData.key_findings && searchData.key_findings.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-black/25 border border-white/10 space-y-2">
                          <p className="font-bold text-[11px] text-cyan-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                            <span>
                              {selectedLanguage === "tamil" ? "முக்கிய பகுப்பாய்வு நுண்ணறிவு" :
                               selectedLanguage === "hindi" ? "प्रमुख विश्लेषणात्मक निष्कर्ष" :
                               selectedLanguage === "french" ? "Principales Conclusions Analytiques" :
                               selectedLanguage === "spanish" ? "Principales Conclusiones Analíticas" :
                               selectedLanguage === "telugu" ? "కీలక విశ్లేషణాత్మక అంతర్దృష్టులు" :
                               "Key Research & Analytical Insights"}
                            </span>
                          </p>
                          <ul className="space-y-1.5 text-xs text-white/90">
                            {(translatedData && selectedLanguage !== "english" && translatedData.translated_key_findings?.length
                              ? translatedData.translated_key_findings
                              : searchData.key_findings
                            ).map((finding, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <span className="text-[#2DD4BF] font-black mt-0.5">•</span>
                                <span className="leading-relaxed">{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Verified Academic & Web Reference Sources */}
                      {searchData.sources && searchData.sources.length > 0 && (
                        <div className="pt-2 border-t border-white/10 space-y-1.5">
                          <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wider">
                            Verified Academic &amp; Web References:
                          </p>
                          <div className="space-y-1">
                            {searchData.sources.map((src, i) => (
                              <a
                                key={i}
                                href={src.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#2DD4BF] hover:underline flex items-center justify-between transition group"
                              >
                                <span className="truncate max-w-[280px] font-medium">{src.title}</span>
                                <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70 group-hover:opacity-100" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback if Search is not available or encountered error */}
                  {!searchLoading && !searchData && (
                    <div className="space-y-3.5 text-sm sm:text-[15px] text-white/95 leading-relaxed font-sans">
                      <p>
                        {translatedData && selectedLanguage !== "english"
                          ? translatedData.translated_summary
                          : desc?.lead}
                      </p>
                      {selectedTerm.context_sentence && (
                        <p className="text-xs sm:text-sm text-purple-100/90 leading-relaxed italic bg-white/5 p-3 rounded-xl border border-white/10">
                          {translatedData && selectedLanguage !== "english" && translatedData.context_translation
                            ? translatedData.context_translation
                            : desc?.mechanics}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Formula / Code if exists */}
                  {selectedTerm.formula && (
                    <div className="p-2.5 rounded-xl bg-black/20 border border-white/10 text-xs font-mono text-cyan-200">
                      {selectedTerm.formula}
                    </div>
                  )}
                </div>

                {/* Only Action Button: Generate Accurate Visual & Schematic */}
                <div className="mt-5 pt-4 border-t border-white/15 space-y-2">
                  {!visualData && !visualLoading && (
                    <button
                      onClick={handleGenerateVisual}
                      className="w-full py-3 px-4 rounded-xl bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#042F2E] font-black text-xs transition flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-500/20 active:scale-[0.99]"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Generate Accurate Visual Schematic (Content-Grounded)</span>
                    </button>
                  )}

                  {visualLoading && (
                    <div className="py-4 text-center text-xs text-cyan-200 flex items-center justify-center gap-2 bg-black/20 rounded-xl border border-white/10">
                      <div className="w-4 h-4 border-2 border-[#2DD4BF] border-t-transparent rounded-full animate-spin" />
                      <span>Generating accurate vector schematic...</span>
                    </div>
                  )}

                  {visualError && (
                    <p className="text-xs text-rose-300 font-semibold">{visualError}</p>
                  )}

                  {visualData && (
                    <div className="mt-3 space-y-2.5">
                      {/* Top Detail Header Bar on Top Side of Image */}
                      <div className="bg-black/30 border border-white/15 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-sm">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate" title={visualData.title}>
                              {visualData.title || `Schematic: ${selectedTerm.term}`}
                            </p>
                            <p className="text-[10px] text-cyan-200 font-semibold uppercase tracking-wider">
                              {visualData.visual_type || "Vector"} • Content-Grounded Precision
                            </p>
                          </div>
                        </div>

                        {/* Top Side Action Buttons: View Full Image & Download PNG / SVG */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => setIsFullImageOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-[#2DD4BF]/20 hover:bg-[#2DD4BF]/30 border border-[#2DD4BF]/50 text-[11px] font-bold text-[#2DD4BF] transition flex items-center gap-1 shadow-sm"
                            title="View in full high-resolution modal"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Full View</span>
                          </button>
                          <button
                            onClick={handleDownloadPng}
                            className="px-2.5 py-1 rounded-lg bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#042F2E] text-[11px] font-black transition flex items-center gap-1 shadow-sm"
                            title="Download image as PNG"
                          >
                            <Download className="w-3 h-3" />
                            <span>PNG</span>
                          </button>
                          <button
                            onClick={handleDownloadSvg}
                            className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-[10px] font-bold text-white transition flex items-center gap-1"
                            title="Download schematic as SVG vector"
                          >
                            <span>SVG</span>
                          </button>
                        </div>
                      </div>

                      {/* Accurate AI Schematic Vector Display */}
                      <div
                        onClick={() => setIsFullImageOpen(true)}
                        dangerouslySetInnerHTML={{ __html: visualData.svg_code }}
                        className="rounded-xl overflow-hidden border border-white/20 bg-[#FCE2DB] cursor-pointer hover:opacity-95 transition relative group shadow-inner"
                        title="Click to view full image in high resolution"
                      />

                      {/* Component Callouts / Tags if available */}
                      {visualData.labeled_components && visualData.labeled_components.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {visualData.labeled_components.map((comp, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-purple-100 font-medium"
                            >
                              {comp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer: Multi-Language Selector on Left, Brand on Right */}
                <div className="mt-6 pt-3.5 border-t border-white/15 flex items-center justify-between text-xs text-white/70">
                  <div className="flex items-center gap-2">
                    <div className="relative inline-flex items-center">
                      <Globe className="w-3.5 h-3.5 text-[#2DD4BF] mr-1.5 shrink-0" />
                      <select
                        value={selectedLanguage}
                        onChange={(e) => handleLanguageChange(e.target.value)}
                        disabled={translationLoading}
                        className="bg-white/10 hover:bg-white/15 text-white font-medium text-xs rounded-lg px-2.5 py-1 border border-white/20 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] cursor-pointer transition appearance-none pr-6"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232DD4BF'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 0.4rem center",
                          backgroundSize: "0.85em 0.85em",
                        }}
                        title="Select Explanation Language"
                      >
                        <option value="english" className="bg-[#312B6B] text-white">🌐 Plain English</option>
                        <option value="tamil" className="bg-[#312B6B] text-white">தமிழ் (Tamil)</option>
                        <option value="hindi" className="bg-[#312B6B] text-white">हिन्दी (Hindi)</option>
                        <option value="french" className="bg-[#312B6B] text-white">Français (French)</option>
                        <option value="spanish" className="bg-[#312B6B] text-white">Español (Spanish)</option>
                        <option value="telugu" className="bg-[#312B6B] text-white">తెలుగు (Telugu)</option>
                      </select>
                    </div>

                    {translationLoading && (
                      <span className="flex items-center gap-1 text-[11px] text-[#2DD4BF] animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] animate-ping" />
                        <span>Translating...</span>
                      </span>
                    )}

                    {translationError && (
                      <span className="text-[11px] text-rose-300" title={translationError}>
                        Translation failed
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 font-black tracking-wider text-[#2DD4BF]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>ReadFlow.ai</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Full Image Lightbox Modal */}
      <AnimatePresence>
        {isFullImageOpen && visualData && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="max-w-4xl w-full bg-[#312B6B] border-2 border-[#E4A3D4] rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-hidden"
            >
              {/* Full Image Modal Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/15 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-[#2DD4BF]/20 border border-[#2DD4BF]/40 flex items-center justify-center text-[#2DD4BF] shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-black text-white truncate">
                      {visualData.title || `Accurate AI Schematic: ${selectedTerm?.term}`}
                    </h3>
                    <p className="text-xs text-purple-200 truncate">
                      {visualData.diagram_description || `AI-generated vector cross-section illustrating verified structural components of ${selectedTerm?.term}.`}
                    </p>
                  </div>
                </div>

                {/* Modal Action Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadPng}
                    className="px-3 py-1.5 rounded-xl bg-[#2DD4BF] hover:bg-[#2DD4BF]/90 text-[#042F2E] text-xs font-black transition flex items-center gap-1.5 shadow-md"
                    title="Download high-resolution PNG"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PNG</span>
                  </button>
                  <button
                    onClick={handleDownloadSvg}
                    className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
                    title="Download SVG vector"
                  >
                    <Download className="w-4 h-4" />
                    <span>SVG</span>
                  </button>
                  <button
                    onClick={() => setIsFullImageOpen(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
                    title="Close full view"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Full Image Display Container */}
              <div className="flex-1 min-h-0 bg-[#FCE2DB] rounded-2xl p-4 sm:p-6 border border-[#E4A3D4] flex items-center justify-center overflow-auto shadow-inner">
                <div
                  dangerouslySetInnerHTML={{ __html: visualData.svg_code }}
                  className="w-full max-w-3xl flex items-center justify-center"
                />
              </div>

              {/* Modal Footer with Component details */}
              {visualData.labeled_components && visualData.labeled_components.length > 0 && (
                <div className="shrink-0 flex flex-wrap items-center gap-1.5 pt-1 text-xs text-purple-100">
                  <span className="font-bold text-cyan-200 mr-1">Key Components:</span>
                  {visualData.labeled_components.map((comp, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
