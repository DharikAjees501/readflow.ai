import re
from typing import Optional, Dict, Tuple
from app.core.logger import logger

class DictionaryService:
    """
    Integrates PyMultiDictionary for technical, clinical, and medical word identification and plain-English definitions.
    Caches definitions in-memory for instant lookups.
    """
    def __init__(self):
        self.cache: Dict[str, Tuple[str, str]] = {}
        try:
            from PyMultiDictionary import MultiDictionary
            self._multidict = MultiDictionary()
            self.available = True
            logger.info("[DICTIONARY SERVICE] PyMultiDictionary initialized and ready for technical & medical term identification.")
        except Exception as e:
            self._multidict = None
            self.available = False
            logger.warning(f"[DICTIONARY SERVICE] PyMultiDictionary initialization notice: {e}")

    def lookup_definition(self, term: str) -> Optional[Tuple[str, str]]:
        """
        Looks up word or phrase definition using PyMultiDictionary.
        Returns a tuple of (part_of_speech_or_category, clean_definition_text), or None.
        """
        if not self.available or not self._multidict:
            return None

        clean_term = term.strip().lower()
        if not clean_term or len(clean_term) < 2:
            return None

        if clean_term in self.cache:
            return self.cache[clean_term]

        # Candidates to try: original term first, followed by morphological stems
        candidates = [clean_term]
        if clean_term.endswith("ies") and len(clean_term) > 4:
            candidates.append(clean_term[:-3] + "y")
        elif clean_term.endswith("es") and len(clean_term) > 4:
            candidates.append(clean_term[:-2] + "is")
            candidates.append(clean_term[:-2])
            candidates.append(clean_term[:-1])
        elif clean_term.endswith("s") and not clean_term.endswith(("is", "us", "ss", "as", "os")) and len(clean_term) > 3:
            candidates.append(clean_term[:-1])
        elif clean_term.endswith("ic") and len(clean_term) > 4:
            candidates.append(clean_term[:-2] + "ia")
            candidates.append(clean_term[:-2] + "is")
        elif clean_term.endswith("al") and len(clean_term) > 4:
            candidates.append(clean_term[:-2] + "um")
            candidates.append(clean_term[:-2])

        for cand in candidates:
            try:
                meanings = self._multidict.meaning('en', cand)
                if meanings and isinstance(meanings, (list, tuple)) and len(meanings) > 0:
                    pos_list = meanings[0] if isinstance(meanings[0], list) else []
                    pos = pos_list[0] if pos_list else "Domain Concept"
                    def_text = ""
                    if len(meanings) > 2 and meanings[2]:
                        def_text = str(meanings[2])
                    elif len(meanings) > 1 and meanings[1]:
                        def_text = str(meanings[1])

                    if def_text:
                        clean_def = def_text.replace('\u25aa', ' - ').replace('\u2022', ' - ').replace('\u25cf', ' - ')
                        clean_def = clean_def.replace('\u2018', "'").replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
                        clean_def = clean_def.replace('\u2013', '-').replace('\u2014', '-')
                        clean_def = re.sub(r'[\ufffd\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', clean_def).strip()
                        clean_def = re.sub(r'\s+', ' ', clean_def)
                        if clean_def:
                            clean_def = clean_def[0].upper() + clean_def[1:]
                            self.cache[clean_term] = (pos, clean_def)
                            logger.info(f"[DICTIONARY] PyMultiDictionary defined '{term}' (stem: '{cand}'): {clean_def[:75]}...")
                            return (pos, clean_def)
            except Exception as e:
                logger.debug(f"[DICTIONARY] Lookup for '{cand}' bypassed: {e}")

        return None

dictionary_service = DictionaryService()
