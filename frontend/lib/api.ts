import {
  DocumentDetailResponse,
  DocumentSummary,
  SampleDocumentItem,
  TermInspectResponse,
  DeepSearchResponse,
  VisualGenerateResponse,
  TranslationResponse,
} from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiClient {
  static getPageImageUrl(docId: string, pageNumber: number): string {
    return `${API_BASE}/api/documents/page/${docId}/${pageNumber}/image`;
  }

  private static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMessage = `API error: ${res.statusText}`;
      try {
        const errorData = await res.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === "string" ? errorData.detail : JSON.stringify(errorData.detail);
        }
      } catch {
        // ignore parse error
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // --- Document Endpoints ---
  static async uploadPdf(file: File): Promise<DocumentDetailResponse> {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<DocumentDetailResponse>("/api/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  static async getActiveDocument(): Promise<DocumentDetailResponse | null> {
    return this.request<DocumentDetailResponse | null>("/api/documents/active");
  }

  static async deleteActiveDocument(): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>("/api/documents/active", {
      method: "DELETE",
    });
  }

  static async getSamples(): Promise<SampleDocumentItem[]> {
    return this.request<SampleDocumentItem[]>("/api/documents/samples");
  }

  static async loadSample(sampleId: string): Promise<DocumentDetailResponse> {
    return this.request<DocumentDetailResponse>(`/api/documents/load-sample/${sampleId}`, {
      method: "POST",
    });
  }

  // --- Analysis Endpoints ---
  static async analyzeDocument(): Promise<DocumentSummary> {
    return this.request<DocumentSummary>("/api/analysis/analyze", {
      method: "POST",
    });
  }

  static async getAnalysisStatus(): Promise<{
    is_analyzed: boolean;
    document_id?: string;
    summary?: DocumentSummary;
  }> {
    return this.request("/api/analysis/status");
  }

  // --- Explore & On-Demand Actions ---
  static async inspectTerm(term: string, context?: string, domain?: string): Promise<TermInspectResponse> {
    return this.request<TermInspectResponse>("/api/explore/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term, context, domain }),
    });
  }

  static async triggerDeepSearch(term: string, domain?: string, context?: string): Promise<DeepSearchResponse> {
    return this.request<DeepSearchResponse>("/api/explore/deep-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term, domain, context }),
    });
  }

  static async triggerVisualGeneration(
    term: string,
    domain?: string,
    definition?: string,
    visualType?: string,
    context?: string
  ): Promise<VisualGenerateResponse> {
    return this.request<VisualGenerateResponse>("/api/explore/generate-visual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term,
        domain,
        definition,
        visual_type: visualType,
        context,
      }),
    });
  }

  static async getGeminiStatus(): Promise<{ configured: boolean; model: string; grounding_available: boolean }> {
    return this.request("/api/explore/status");
  }

  static async setGeminiKey(apiKey: string): Promise<{ success: boolean; configured: boolean }> {
    return this.request("/api/explore/set-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
  }

  static async translateTerm(
    term: string,
    targetLanguage: string,
    summary: string,
    keyFindings?: string[],
    context?: string,
    domain?: string
  ): Promise<TranslationResponse> {
    return this.request<TranslationResponse>("/api/explore/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term,
        target_language: targetLanguage,
        summary,
        key_findings: keyFindings,
        context,
        domain,
      }),
    });
  }
}

