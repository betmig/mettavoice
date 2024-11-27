export const SUPPORTED_LOCALES = {
  // English
  'en-US': 'English (United States)',
  'en-GB': 'English (United Kingdom)',
  'en-AU': 'English (Australia)',
  'en-CA': 'English (Canada)',
  'en-IN': 'English (India)',
  'en-IE': 'English (Ireland)',
  'en-NZ': 'English (New Zealand)',
  'en-ZA': 'English (South Africa)',
  'en-PH': 'English (Philippines)',
  'en-SG': 'English (Singapore)',
  
  // Spanish
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'es-AR': 'Spanish (Argentina)',
  'es-US': 'Spanish (United States)',
  
  // French
  'fr-FR': 'French (France)',
  'fr-CA': 'French (Canada)',
  'fr-BE': 'French (Belgium)',
  'fr-CH': 'French (Switzerland)',
  
  // German
  'de-DE': 'German (Germany)',
  'de-AT': 'German (Austria)',
  'de-CH': 'German (Switzerland)',
  
  // Chinese
  'zh-CN': 'Chinese (Mainland)',
  'zh-TW': 'Chinese (Taiwan)',
  'zh-HK': 'Chinese (Hong Kong)',
  
  // Japanese
  'ja-JP': 'Japanese (Japan)',
  
  // Korean
  'ko-KR': 'Korean (Korea)',
  
  // Italian
  'it-IT': 'Italian (Italy)',
  'it-CH': 'Italian (Switzerland)',
  
  // Portuguese
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  
  // Russian
  'ru-RU': 'Russian (Russia)',
  
  // Arabic
  'ar-SA': 'Arabic (Saudi Arabia)',
  'ar-AE': 'Arabic (UAE)',
  'ar-EG': 'Arabic (Egypt)',
  
  // Hindi
  'hi-IN': 'Hindi (India)',
  
  // Other European Languages
  'nl-NL': 'Dutch (Netherlands)',
  'nl-BE': 'Dutch (Belgium)',
  'pl-PL': 'Polish (Poland)',
  'cs-CZ': 'Czech (Czech Republic)',
  'da-DK': 'Danish (Denmark)',
  'fi-FI': 'Finnish (Finland)',
  'el-GR': 'Greek (Greece)',
  'hu-HU': 'Hungarian (Hungary)',
  'nb-NO': 'Norwegian (Norway)',
  'sv-SE': 'Swedish (Sweden)',
  'tr-TR': 'Turkish (Turkey)',
  'uk-UA': 'Ukrainian (Ukraine)',
  'ro-RO': 'Romanian (Romania)',
  'bg-BG': 'Bulgarian (Bulgaria)',
  'sk-SK': 'Slovak (Slovakia)',
  'sl-SI': 'Slovenian (Slovenia)',
  
  // Asian Languages
  'th-TH': 'Thai (Thailand)',
  'vi-VN': 'Vietnamese (Vietnam)',
  'id-ID': 'Indonesian (Indonesia)',
  'ms-MY': 'Malay (Malaysia)',
  'ta-IN': 'Tamil (India)',
  'te-IN': 'Telugu (India)',
  'ml-IN': 'Malayalam (India)',
  'bn-IN': 'Bengali (India)',
  
  // Other Languages
  'he-IL': 'Hebrew (Israel)',
  'fa-IR': 'Persian (Iran)',
  'ur-PK': 'Urdu (Pakistan)',
  'af-ZA': 'Afrikaans (South Africa)',
  'sw-KE': 'Swahili (Kenya)',
  'is-IS': 'Icelandic (Iceland)',
  'cy-GB': 'Welsh (United Kingdom)'
} as const;

export const getLocaleDisplayName = (localeCode: string): string => {
  // First check if it's in our predefined list
  if (localeCode in SUPPORTED_LOCALES) {
    return SUPPORTED_LOCALES[localeCode as keyof typeof SUPPORTED_LOCALES];
  }

  try {
    // Get the language name
    const language = new Intl.DisplayNames([navigator.language], { type: 'language' })
      .of(localeCode.split('-')[0]);
    
    // Get the region name if it exists
    const regionCode = localeCode.split('-')[1];
    let regionName = '';
    if (regionCode) {
      regionName = new Intl.DisplayNames([navigator.language], { type: 'region' })
        .of(regionCode);
    }

    // Capitalize first letter of language
    const capitalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1);
    
    // Return formatted string
    return regionName ? `${capitalizedLanguage} (${regionName})` : capitalizedLanguage;
  } catch {
    // Fallback if Intl API fails
    return localeCode;
  }
};