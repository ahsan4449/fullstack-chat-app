import { v2 } from "@google-cloud/translate";

const { Translate } = v2;
const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
if (!apiKey) {
  console.warn("⚠️  GOOGLE_TRANSLATE_API_KEY is not set. Translation will be disabled.");
}
const translate = apiKey ? new Translate({ key: apiKey }) : null;

export const translateText = async (text, target = "en") => {
  if (!text || !translate) return "";
  try {
    const [translations] = await translate.translate(text, target);
    return Array.isArray(translations) ? translations[0] : translations;
  } catch (error) {
    console.error("Translation API error:", error);
    return ""; // Fallback gracefully if translation fails
  }
};
