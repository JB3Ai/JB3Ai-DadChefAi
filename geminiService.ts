import { GoogleGenAI, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, KitchenLocation } from "./types";

const openAiApiKey = process.env.OPENAI_API_KEY || '';
const openAiBaseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const openAiModel = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';

const geminiClient = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

function parseJsonArray<T>(raw: string, fallback: T[] = []): T[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as T[];
  } catch {
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed)) return parsed as T[];
      } catch {
      }
    }
  }
  return fallback;
}

async function openAiChat(messages: any[], temperature = 0.4): Promise<string> {
  const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify({
      model: openAiModel,
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

export const analyzeKitchenImage = async (base64Image: string, location: KitchenLocation): Promise<string[]> => {
  if (openAiApiKey) {
    const prompt = `List all visible food ingredients in this ${location}. Return ONLY a JSON array of strings.`;
    const content = await openAiChat([
      {
        role: 'system',
        content: 'You are an assistant that extracts ingredient names from kitchen images.'
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: base64Image } }
        ]
      }
    ]);
    return parseJsonArray<string>(content, []);
  }

  if (!geminiClient) return [];

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
        { text: `List all visible food ingredients in this ${location}. Return only a JSON array of strings.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
    }
  });

  return parseJsonArray<string>(response.text || "[]", []);
};

export const generateRecipes = async (
  inventory: { fridge: string[]; pantry: string[]; freezer: string[] },
  restrictions: DietaryRestriction[],
  kidAges: number[],
  mode: 'standard' | 'lunchbox' = 'standard'
): Promise<Recipe[]> => {
  const ageContext = kidAges.length > 0 ? `The kids are aged: ${kidAges.join(', ')} years old.` : 'The meal is for kids.';
  const restrictionStr = restrictions.length > 0 ? `Avoid these: ${restrictions.join(', ')}.` : '';
  const modeContext = mode === 'lunchbox' ? 'Focus on lunchbox-friendly ideas.' : 'Focus on dinner/home meal ideas.';

  const prompt = `
You are a supportive culinary coach for a busy solo dad.

Inventory:
- Fridge: ${inventory.fridge.join(', ')}
- Pantry: ${inventory.pantry.join(', ')}
- Freezer: ${inventory.freezer.join(', ')}

${ageContext}
${restrictionStr}
${modeContext}

Return EXACTLY a JSON array with 4 recipes.
Each recipe must include:
- id (string)
- title (string)
- description (string)
- difficulty (one of: "Quick Win", "Staple", "Weekend Project")
- prepTime (string)
- calories (number)
- kidFriendlyReason (string)
- ingredients (array of { name, amount, isAvailable })
- steps (array of strings)
- dietaryTags (array of strings)
`;

  if (openAiApiKey) {
    const content = await openAiChat([
      {
        role: 'system',
        content: 'You are an expert meal-planning assistant. Always return valid JSON only.'
      },
      {
        role: 'user',
        content: prompt
      }
    ]);

    const rawRecipes = parseJsonArray<any>(content, []);
    return rawRecipes.map((recipe: any) => ({
      ...recipe,
      isLunchbox: mode === 'lunchbox',
      image: `https://loremflickr.com/400/300/food,cooking,kids,${mode === 'lunchbox' ? 'lunchbox' : 'meal'}?lock=${Math.floor(Math.random() * 1000)}`
    }));
  }

  if (!geminiClient) return [];

  const response = await geminiClient.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    }
  });

  const rawRecipes = parseJsonArray<any>(response.text || "[]", []);
  return rawRecipes.map((recipe: any) => ({
    ...recipe,
    isLunchbox: mode === 'lunchbox',
    image: `https://loremflickr.com/400/300/food,cooking,kids,${mode === 'lunchbox' ? 'lunchbox' : 'meal'}?lock=${Math.floor(Math.random() * 1000)}`
  }));
};

export const speakStep = async (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(`Listen dad, here is your next step: ${text}`);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    return;
  }

  if (!geminiClient) return;

  try {
    const response = await geminiClient.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Listen dad, here is your next step: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const browser = globalThis as any;
    const binary = browser.atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const AudioContextCtor = browser.AudioContext || browser.webkitAudioContext;
    const audioContext = new AudioContextCtor({ sampleRate: 24000 });
    const int16 = new Int16Array(bytes.buffer);
    const frameCount = int16.length;
    const audioBuffer = audioContext.createBuffer(1, frameCount, 24000);
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) channel[i] = int16[i] / 32768;

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start();
  } catch (error) {
    console.error('TTS failed', error);
  }
};
