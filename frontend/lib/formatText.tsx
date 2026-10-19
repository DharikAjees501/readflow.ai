import React from "react";

export interface FormattedTextProps {
  text: string | null | undefined;
  highlightTerms?: (string | null | undefined)[] | string | null | undefined;
  className?: string;
  termClassName?: string;
  boldClassName?: string;
}

/**
 * Builds a regex pattern that matches the term in both singular and plural forms,
 * respecting word boundaries where applicable.
 */
export function buildTermRegex(term: string): string | null {
  const clean = term.trim();
  if (!clean) return null;
  const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let pattern = escaped;

  if (/^[a-zA-Z\s-]+$/.test(clean)) {
    const lower = clean.toLowerCase();
    if (lower.endsWith("ies")) {
      const stem = clean.slice(0, -3);
      pattern = `\\b(?:${stem}ies|${stem}y)\\b`;
    } else if (lower.endsWith("es")) {
      const stem = clean.slice(0, -2);
      pattern = `\\b(?:${escaped}|${stem})\\b`;
    } else if (lower.endsWith("s")) {
      const stem = clean.slice(0, -1);
      pattern = `\\b(?:${escaped}|${stem})\\b`;
    } else {
      pattern = `\\b${escaped}(?:s|es)?\\b`;
    }
  } else {
    pattern = escaped;
  }
  return pattern;
}

/**
 * FormattedText component that:
 * 1. Converts markdown bold (**term** or ***term***) into <strong> elements, completely stripping asterisks.
 * 2. Emphasizes the clicked term (highlightTerms) in bold wherever it appears.
 * 3. Strips any stray asterisk characters (*) so no raw '*' symbols ever display in answers.
 */
export function FormattedText({
  text,
  highlightTerms,
  className = "",
  termClassName = "font-black text-[#2DD4BF] tracking-wide",
  boldClassName = "font-bold text-white tracking-wide",
}: FormattedTextProps) {
  if (!text) return null;

  const rawList = Array.isArray(highlightTerms) ? highlightTerms : [highlightTerms];
  const termsList = rawList
    .filter((t): t is string => Boolean(t && typeof t === "string" && t.trim().length > 0))
    .map((t) => t.trim());

  const termPatterns = termsList.map(buildTermRegex).filter((p): p is string => Boolean(p));
  const hasTerms = termPatterns.length > 0;
  const termGroup = hasTerms ? `(${termPatterns.join("|")})` : null;

  const regex = termGroup
    ? new RegExp(`(\\*{2,3}([^*]+)\\*{2,3})|${termGroup}|(\\*(?:(?![*]).)+\\*)`, "gi")
    : new RegExp(`(\\*{2,3}([^*]+)\\*{2,3})|(\\*(?:(?![*]).)+\\*)`, "gi");

  let lastIdx = 0;
  let match: RegExpExecArray | null;
  const nodes: React.ReactNode[] = [];
  let keyCounter = 0;

  const isTermMatch = (str: string): boolean => {
    const s = str.trim().toLowerCase();
    return termsList.some((t) => {
      const tl = t.toLowerCase();
      return (
        s === tl ||
        s === `${tl}s` ||
        s === `${tl}es` ||
        tl === `${s}s` ||
        tl === `${s}es`
      );
    });
  };

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      const chunk = text.slice(lastIdx, match.index).replace(/\*/g, "");
      if (chunk) {
        nodes.push(<span key={keyCounter++}>{chunk}</span>);
      }
    }

    if (match[2]) {
      // **bold** or ***bold italic***
      const inner = match[2].trim().replace(/\*/g, "");
      const isMatch = isTermMatch(inner);
      nodes.push(
        <strong
          key={keyCounter++}
          className={isMatch ? termClassName : boldClassName}
        >
          {inner}
        </strong>
      );
    } else if (termGroup && match[3]) {
      // Highlighted term matched directly in plain text
      nodes.push(
        <strong key={keyCounter++} className={termClassName}>
          {match[3]}
        </strong>
      );
    } else {
      // *italic/bold*
      const raw = match[0];
      const inner = raw.replace(/^\*+|\*+$/g, "").trim().replace(/\*/g, "");
      if (inner) {
        const isMatch = isTermMatch(inner);
        nodes.push(
          <strong
            key={keyCounter++}
            className={isMatch ? termClassName : boldClassName}
          >
            {inner}
          </strong>
        );
      }
    }

    lastIdx = regex.lastIndex;
  }

  if (lastIdx < text.length) {
    const chunk = text.slice(lastIdx).replace(/\*/g, "");
    if (chunk) {
      nodes.push(<span key={keyCounter++}>{chunk}</span>);
    }
  }

  return <span className={className}>{nodes}</span>;
}
