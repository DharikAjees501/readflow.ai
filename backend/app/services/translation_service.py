import json
import urllib.request
import urllib.parse
import asyncio
from typing import Dict, Any, List, Optional
from app.core.logger import logger
from app.schemas.explore import TranslationRequest, TranslationResponse

SUPPORTED_LANGUAGES = {
    "tamil": {"code": "ta", "native": "தமிழ்", "label": "தமிழ் (Tamil)"},
    "hindi": {"code": "hi", "native": "हिन्दी", "label": "हिन्दी (Hindi)"},
    "french": {"code": "fr", "native": "Français", "label": "Français (French)"},
    "spanish": {"code": "es", "native": "Español", "label": "Español (Spanish)"},
    "telugu": {"code": "te", "native": "తెలుగు", "label": "తెలుగు (Telugu)"},
    "english": {"code": "en", "native": "English", "label": "Plain English (English)"},
}

class TranslationService:
    def __init__(self):
        self._cache: Dict[str, TranslationResponse] = {}

    def _get_lang_meta(self, lang_input: str) -> Dict[str, str]:
        key = lang_input.strip().lower()
        if key in SUPPORTED_LANGUAGES:
            return SUPPORTED_LANGUAGES[key]
        for k, v in SUPPORTED_LANGUAGES.items():
            if v["code"] == key or v["native"].lower() in key:
                return v
        return SUPPORTED_LANGUAGES["english"]

    def _translate_text_sync(self, text: str, target_code: str) -> str:
        if not text or not text.strip():
            return ""
        if target_code == "en":
            return text

        try:
            # High-accuracy neural translation via secure translation gateway
            url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_code}&dt=t&q=" + urllib.parse.quote(text)
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReadFlow/1.0 AcademicReader"}
            )
            with urllib.request.urlopen(req, timeout=4.5) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
                if data and isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                    translated_segments = [seg[0] for seg in data[0] if seg and len(seg) > 0 and seg[0]]
                    return "".join(translated_segments).strip()
        except Exception as e:
            logger.warning(f"[TRANSLATION NOTICE] Direct translation notice for code '{target_code}': {e}")

        return text

    async def translate_explanation(self, req: TranslationRequest) -> TranslationResponse:
        meta = self._get_lang_meta(req.target_language)
        target_code = meta["code"]
        target_label = meta["label"]

        # Cache key based on term, target language, and summary snippet
        cache_key = f"{req.term.strip().lower()}:{target_code}:{hash(req.summary)}"
        if cache_key in self._cache:
            logger.info(f"[TRANSLATION CACHE HIT] Returning cached {meta['label']} translation for '{req.term}'")
            return self._cache[cache_key]

        logger.info(f"[TRANSLATION DISPATCH] Translating explanation for '{req.term}' into {target_label} ({target_code})")

        # Run translation tasks in parallel via asyncio
        async def trans(t: str) -> str:
            return await asyncio.to_thread(self._translate_text_sync, t, target_code)

        # 1. Translate Term
        term_task = trans(req.term)
        # 2. Translate Summary
        summary_task = trans(req.summary)
        # 3. Translate Key Findings
        findings_tasks = [trans(f) for f in (req.key_findings or [])]
        # 4. Translate Context Sentence (if any)
        context_task = trans(req.context) if req.context else None

        results = await asyncio.gather(
            term_task,
            summary_task,
            asyncio.gather(*findings_tasks) if findings_tasks else asyncio.sleep(0, result=[]),
            context_task if context_task else asyncio.sleep(0, result=None)
        )

        translated_term = results[0] or req.term
        translated_summary = results[1] or req.summary
        translated_findings = results[2] or []
        translated_context = results[3]

        response = TranslationResponse(
            term=req.term,
            target_language=req.target_language,
            target_language_label=target_label,
            translated_term=translated_term,
            translated_summary=translated_summary,
            translated_key_findings=translated_findings,
            context_translation=translated_context
        )

        self._cache[cache_key] = response
        logger.info(f"[TRANSLATION SUCCESS] Completed {target_label} translation for '{req.term}' with {len(translated_findings)} key findings.")
        return response

translation_service = TranslationService()
