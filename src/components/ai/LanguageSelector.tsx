import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe, Languages } from "lucide-react";

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const SUPPORTED_LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "sa", name: "Sanskrit", nativeName: "संस्कृत", flag: "🇮🇳" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (languageCode: string) => void;
  showLabel?: boolean;
  className?: string;
}

export default function LanguageSelector({ 
  selectedLanguage, 
  onLanguageChange, 
  showLabel = true,
  className = "" 
}: LanguageSelectorProps) {
  const selectedLang = SUPPORTED_LANGUAGES.find(lang => lang.code === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <div className={`space-y-2 ${className}`}>
      {showLabel && (
        <Label htmlFor="language" className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Language
        </Label>
      )}
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="min-w-[200px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{selectedLang.flag}</span>
              <span>{selectedLang.nativeName}</span>
              {selectedLang.code !== "en" && (
                <span className="text-xs text-muted-foreground">({selectedLang.name})</span>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center gap-2">
                <span>{language.flag}</span>
                <span>{language.nativeName}</span>
                {language.code !== "en" && (
                  <span className="text-xs text-muted-foreground">({language.name})</span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export { SUPPORTED_LANGUAGES }; 