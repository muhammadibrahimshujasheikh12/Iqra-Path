
import { GoogleGenAI, Modality } from "@google/genai";

const BASE_SYSTEM_INSTRUCTION = `
You are Noor, a spiritual companion.
Directives:
1. Be natural, concise, and warm. Avoid robotic headers.
2. Speak as if talking to a friend.
3. ABSOLUTELY NO MARKDOWN BOLDING (**). Use plain text only.
4. If interrupted, stop immediately.
5. Do not hallucinate formatting. Keep it simple.
`;

const sanitizeOutput = (text: string): string => {
  return text.replace(/\*\*/g, '').trim();
};

export const getGeminiResponse = async (prompt: string, userContext?: string, responseMimeType?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}${userContext ? `\n\nContext: ${userContext}` : ''}`;

  const config: any = {
    systemInstruction: finalSystemInstruction,
    temperature: 0.7,
  };

  if (responseMimeType) {
    config.responseMimeType = responseMimeType;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: config,
    });
    return sanitizeOutput(response.text || "I am listening.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429) return "QUOTA_EXCEEDED: The sanctuary is at capacity.";
    return "Sanctuary is temporarily resting. Please try again in a moment.";
  }
};

/**
 * Streamed Chat Response for Immediate Feedback
 * Optimized for speed: Thinking Budget set to 0.
 */
export const streamNoorChat = async (
  history: {role: 'user' | 'model', message: string}[], 
  newMessage: string,
  onChunk: (text: string) => void
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contents = history.map(h => ({
        role: h.role,
        parts: [{ text: h.message }]
    }));
    
    contents.push({
        role: 'user',
        parts: [{ text: newMessage }]
    });

    try {
        const response = await ai.models.generateContentStream({
            model: 'gemini-3-flash-preview',
            contents: contents,
            config: {
                systemInstruction: BASE_SYSTEM_INSTRUCTION,
                temperature: 0.7,
                thinkingConfig: { thinkingBudget: 0 } // Zero latency optimization
            }
        });

        let fullText = "";
        
        // Safety check for iterator
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            for await (const chunk of response) {
                const chunkText = chunk.text;
                if (chunkText) {
                    fullText += chunkText;
                    onChunk(sanitizeOutput(fullText));
                }
            }
        }
        return sanitizeOutput(fullText);
    } catch (e: any) {
        console.error("Stream Error:", e);
        const errorMsg = "I am having trouble connecting to the sacred source right now.";
        onChunk(errorMsg);
        return errorMsg;
    }
};

/**
 * Generic Stream for AI Assistant
 */
export const streamGeminiResponse = async (
  prompt: string,
  userContext: string | undefined,
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const finalSystemInstruction = `${BASE_SYSTEM_INSTRUCTION}${userContext ? `\n\nContext: ${userContext}` : ''}`;

  try {
    const response = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: finalSystemInstruction,
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 } // Zero latency optimization
      },
    });

    let fullText = "";
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
        for await (const chunk of response) {
            const chunkText = chunk.text;
            if (chunkText) {
                fullText += chunkText;
                onChunk(sanitizeOutput(fullText));
            }
        }
    }
    return sanitizeOutput(fullText);
  } catch (error) {
    console.error("Gemini Stream Error:", error);
    const errorMsg = "Connection interrupted.";
    onChunk(errorMsg);
    return errorMsg;
  }
};

export const getNoorChatResponse = async (history: any[], msg: string) => {
    let final = "";
    await streamNoorChat(history, msg, (t) => final = t);
    return final;
};

/**
 * Improved Masjid Locator using Google Maps Grounding
 * Uses gemini-2.5-flash as required for googleMaps tool.
 */
export const getNearbyMasjidsFromAI = async (lat: number, lng: number): Promise<{text: string, masjids: {name: string, address: string, url: string}[]}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Identify the 5 nearest masjids to my coordinates. List their names and exact addresses. NO BOLDING (**).",
        config: {
          tools: [{ googleMaps: {} } as any],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: lat, longitude: lng }
            }
          }
        },
      });

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const masjids: {name: string, address: string, url: string}[] = [];
      
      // Extract verified location data from grounding chunks
      groundingChunks.forEach((chunk: any) => {
        if (chunk.maps) {
          masjids.push({
            name: chunk.maps.title || "Masjid",
            address: "", // Often address is contained in the text, we'll parse or use placeholder
            url: chunk.maps.uri || ""
          });
        }
      });

      return { 
        text: sanitizeOutput(response.text || ""), 
        masjids: masjids.length > 0 ? masjids : [] 
      };
  } catch (error) {
    console.error("Masjid Locator Error:", error);
    return { text: "UNAVAILABLE", masjids: [] };
  }
};

export const getGeminiVoiceResponse = async (prompt: string, userContext?: string, language: string = 'en-US'): Promise<string | undefined> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Dynamic voice context to support languages
  const langInstruction = language.startsWith('ur') ? "Reply in Urdu. Use Roman Urdu if script is not supported." : 
                          language.startsWith('ar') ? "Reply in Arabic." : 
                          "Reply in the target language.";
                          
  const voiceContext = `${userContext || ''}\nSTRICT RULE: Keep response VERY short (max 200 chars). ${langInstruction} Natural speech. No formatting.`;
  
  try {
     const textToSpeak = await getGeminiResponse(prompt, voiceContext);
     
     if (!textToSpeak || textToSpeak.includes("resting") || textToSpeak.includes("QUOTA")) {
         console.warn("TTS Gen Text Failed:", textToSpeak);
         return undefined;
     }

     const cleanText = textToSpeak.substring(0, 300); // Enforce limit for TTS stability

     const response = await ai.models.generateContent({
       model: "gemini-2.5-flash-preview-tts",
       contents: [{ parts: [{ text: cleanText }] }],
       config: {
         responseModalities: [Modality.AUDIO],
         speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
         },
       },
     });
     
     const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
     if (!audioData) console.error("TTS returned no audio data");
     return audioData;
  } catch (error) {
    console.error("Gemini TTS Error:", error);
    return undefined;
  }
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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

export async function playPCMData(base64Data: string, audioContext: AudioContext, onEnded?: () => void) {
  try {
    const bytes = decode(base64Data);
    const buffer = await decodeAudioData(bytes, audioContext, 24000, 1);
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    if (onEnded) source.onended = onEnded;
    source.start();
    return source;
  } catch (e) {
    console.error("Audio Playback Error:", e);
    if (onEnded) onEnded();
    return null;
  }
}
