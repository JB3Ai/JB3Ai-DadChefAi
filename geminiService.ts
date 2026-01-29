
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Recipe, DietaryRestriction, KitchenLocation } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

function decode(base64: string) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const analyzeKitchenImage = async (base64Image: string, location: KitchenLocation): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
        { text: `List all visible food ingredients in this ${location}. Return only a JSON array of strings. Focus on items a dad could use for kids' meals. Be specific but concise.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const generateRecipes = async (
  inventory: { fridge: string[]; pantry: string[]; freezer: string[] }, 
  restrictions: DietaryRestriction[], 
  kidAges: number[],
  mode: 'standard' | 'lunchbox' = 'standard'
): Promise<Recipe[]> => {
  const ageContext = kidAges.length > 0 ? `The kids are aged: ${kidAges.join(', ')} years old.` : 'The meal is for kids.';
  const restrictionStr = restrictions.length > 0 ? `Avoid these: ${restrictions.join(', ')}.` : '';
  
  const culinaryStyle = mode === 'lunchbox' 
    ? `Inspiration: Use Bento-style snacks, Indian veggie parathas, South African droëwors boxes, 
       Australian hidden-veggie nuggets, or UK-style quesadillas. Must be cold-safe and nut-free.`
    : `Inspiration: Focus on budget-friendly staples like Cape Malay style stews, frikkadels, 
       hidden-veggie pasta, or simple potato waffles.`;

  const prompt = `You are a supportive culinary coach for a busy solo dad. 
  ${culinaryStyle}
  
  Full Kitchen Inventory:
  - Fridge: ${inventory.fridge.join(', ')}
  - Pantry: ${inventory.pantry.join(', ')}
  - Freezer: ${inventory.freezer.join(', ')}

  ${ageContext} ${restrictionStr}

  Suggest 4 meal ideas. Focus on "Quick Wins", "Staples", or "Weekend Projects".
  Instructions must be ultra-simple. 
  Explain why it's great for these specific ages in "kidFriendlyReason". 
  Include a "Dad-Hack" (tip for saving time or money) in the description.
  Return JSON.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ['Quick Win', 'Staple', 'Weekend Project'] },
            prepTime: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            kidFriendlyReason: { type: Type.STRING },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING },
                  isAvailable: { type: Type.BOOLEAN }
                },
                required: ["name", "isAvailable"]
              }
            },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            dietaryTags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "title", "difficulty", "prepTime", "ingredients", "steps", "kidFriendlyReason"]
        }
      }
    }
  });

  try {
    const rawRecipes = JSON.parse(response.text || "[]");
    return rawRecipes.map((r: any) => ({
      ...r,
      isLunchbox: mode === 'lunchbox',
      image: `https://loremflickr.com/400/300/food,cooking,kids,${mode === 'lunchbox' ? 'lunchbox' : 'meal'}?lock=${Math.floor(Math.random() * 1000)}`
    }));
  } catch (e) {
    return [];
  }
};

export const speakStep = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
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

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
    const source = outputAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(outputAudioContext.destination);
    source.start();
  } catch (e) {
    console.error("TTS failed", e);
  }
};
