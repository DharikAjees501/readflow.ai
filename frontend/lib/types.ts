export type DomainType =
  | "Medical & Healthcare"
  | "Education & Pedagogy"
  | "Industrial & Supply Chain"
  | "Finance & Economics"
  | "Mathematics & Statistics"
  | "Scientific Research (Physics & Chemistry)"
  | "General / Interdisciplinary";

export type TermKind = "simple_concept" | "visual_concept";

export interface SpecializedTerm {
  id: string;
  term: string;
  category: string;
  short_definition: string;
  context_sentence?: string;
  page_number?: number;
  kind: TermKind;
  visual_reasoning?: string;
  formula?: string;
  importance_score: number;
}

export interface CriticalConcept {
  name: string;
  significance: string;
  domain_relevance: string;
}

export interface KeyTakeaway {
  title: string;
  description: string;
  tag: string;
}

export interface DocumentSummary {
  document_id: string;
  detected_domain: string;
  domain_badge_color: string;
  executive_summary: string;
  core_thesis: string;
  critical_concepts: CriticalConcept[];
  key_takeaways: KeyTakeaway[];
  specialized_terms: SpecializedTerm[];
  total_terms_detected: number;
  visual_terms_count: number;
  simple_terms_count: number;
  reading_time_minutes: number;
  complexity_level: "Beginner" | "Intermediate" | "Advanced" | "Research Grade";
}

export interface ContentBlock {
  type: "title" | "heading" | "subheading" | "key_value" | "list_item" | "paragraph";
  text: string;
  level?: number;
  key?: string;
  value?: string;
}

export interface PageInfo {
  page_number: number;
  text: string;
  char_count: number;
  word_count: number;
  image_url?: string;
  blocks?: ContentBlock[];
}

export interface DocumentMetadata {
  id: string;
  filename: string;
  file_size_bytes: number;
  total_pages: number;
  total_words: number;
  created_at: string;
  domain_hint?: string;
  is_sample: boolean;
}

export interface DocumentDetailResponse {
  metadata: DocumentMetadata;
  pages: PageInfo[];
  extracted_text_preview: string;
}

export interface SampleDocumentItem {
  id: string;
  title: string;
  domain: string;
  description: string;
  icon: string;
  pages: number;
}

export interface SearchSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface DeepSearchResponse {
  term: string;
  query_used: string;
  summary: string;
  key_findings: string[];
  sources: SearchSource[];
  grounding_used: boolean;
  academic_citation?: string;
}

export interface VisualGenerateResponse {
  term: string;
  title: string;
  visual_type: string;
  svg_code: string;
  prompt_used: string;
  diagram_description: string;
  labeled_components: string[];
  color_scheme: string;
  real_image_url?: string;
  real_image_title?: string;
  real_image_caption?: string;
  real_image_source_url?: string;
}

export interface TermInspectResponse {
  term: string;
  domain: string;
  category: string;
  definition: string;
  deep_explanation: string;
  pdf_context?: string;
  formula?: string;
  kind: TermKind;
  visual_suggested: boolean;
  visual_type?: string;
}

export interface TranslationResponse {
  term: string;
  target_language: string;
  target_language_label: string;
  translated_term: string;
  translated_summary: string;
  translated_key_findings: string[];
  context_translation?: string;
}
