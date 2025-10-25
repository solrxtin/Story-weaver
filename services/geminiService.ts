import { GoogleGenAI, VideoGenerationReferenceImage, VideoGenerationReferenceType, Modality, GenerateContentRequest } from "@google/genai";
import type { Character, SceneDetails } from "../types";

// --- Helper Functions ---

function formatCharacter(character: Character): string {
    const parts = [];
    if (character.appearance.eyes) parts.push(`${character.appearance.eyes} eyes`);
    if (character.appearance.skin) parts.push(`${character.appearance.skin} skin`);
    if (character.appearance.hair) parts.push(`${character.appearance.hair} hair`);
    const appearance = parts.join(', ');
    
    const outfitParts = [];
    if (character.outfit.upper) outfitParts.push(character.outfit.upper);
    if (character.outfit.lower) outfitParts.push(character.outfit.lower);
    if (character.outfit.footwear) outfitParts.push(character.outfit.footwear);
    const outfit = outfitParts.join(', ');

    let description = `${character.name} (${character.role}, age ${character.age}). `;
    if (appearance) description += `Appearance: ${appearance}. `;
    if (outfit) description += `Outfit: wearing ${outfit}. `;
    if (character.props) description += `Props: ${character.props}.`;
    
    return description;
}


function buildContext(scene: SceneDetails, characters: Character[]): string {
    let context = `Location: ${scene.location}.\n`;
    context += `Environment: ${scene.environment}.\n`;
    context += `Shot Type: ${scene.shotType}.\n`;
    context += `Desired Image Style: ${scene.imageStyle}.\n\n`;

    if (scene.actors.length > 0) {
        context += "Actors in scene:\n";
        scene.actors.forEach(actor => {
            if (actor.characterId === 'temporary') {
                context += `- A temporary character, described as follows: ${actor.description}\n`;
            } else {
                const character = characters.find(c => c.id === actor.characterId);
                if (character) {
                    context += `- ${character.name} is present. Their action/pose: "${actor.description}".\n`;
                    context += `  Full character description: ${formatCharacter(character)}\n`;
                }
            }
        });
    } else {
        context += "There are no actors in the scene.\n"
    }
    
    return context;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function createWavBlob(pcmData: Uint8Array): Blob {
    const sampleRate = 24000; // Gemini TTS sample rate
    const numChannels = 1;
    const bitsPerSample = 16;
    const dataSize = pcmData.length;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    view.setUint32(28, byteRate, true);
    const blockAlign = numChannels * (bitsPerSample / 8);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < dataSize; i++) {
        view.setUint8(44 + i, pcmData[i]);
    }

    return new Blob([view], { type: 'audio/wav' });
}


// --- API Functions ---

export async function composeImagePrompt(scene: SceneDetails, characters: Character[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const context = buildContext(scene, characters);
  
  const systemInstruction = `You are an expert prompt engineer for text-to-image AI models. Your task is to synthesize scene, environment, and character details into a single, cohesive, and highly detailed image prompt. The prompt must be a single paragraph. Do not use lists, bullet points, or line breaks. The final output should be only the prompt itself.`;
  
  const userPromptText = `Synthesize the following details into a cinematic image prompt${scene.referenceImage ? ", using the provided image as a strong reference for style, mood, and composition" : ""}:
---
${context}
---`;

  try {
    const contents: GenerateContentRequest['contents'] = [{
      parts: [{ text: userPromptText }]
    }];

    if (scene.referenceImage) {
      const base64Data = scene.referenceImage.split(',')[1];
      const mimeType = scene.referenceImage.match(/data:(image\/\w+);/)?.[1] || 'image/jpeg';
      contents[0].parts.unshift({
        inlineData: {
          mimeType,
          data: base64Data,
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error composing prompt:", error);
    throw new Error("Failed to compose prompt via Gemini API.");
  }
}


export async function generateImage(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt,
            config: {
                numberOfImages: 1,
                aspectRatio: '16:9',
                outputMimeType: 'image/jpeg',
            },
        });

        const image = response.generatedImages?.[0]?.image;
        if (image?.imageBytes) {
            return `data:image/jpeg;base64,${image.imageBytes}`;
        }
        
        throw new Error('No image was generated by the API.');

    } catch (error) {
        console.error("Error generating image:", error);
        throw new Error("Failed to generate image via Gemini API.");
    }
}

export async function generateVideoFromSequence(prompt: string, images: string[]): Promise<string> {
    const videoAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (images.length === 0) throw new Error("Cannot generate video without images.");
    
    if (images.length > 3) console.warn("More than 3 reference images provided. Only the first 3 will be used.");

    const referenceImagesPayload: VideoGenerationReferenceImage[] = images.slice(0, 3).map(base64Data => {
        const imageBytes = base64Data.split(',')[1];
        const mimeType = base64Data.match(/data:(image\/\w+);/)?.[1] || 'image/jpeg';
        return {
            image: { imageBytes, mimeType },
            referenceType: VideoGenerationReferenceType.ASSET,
        };
    });

    try {
        let operation = await videoAI.models.generateVideos({
            model: 'veo-3.1-generate-preview',
            prompt,
            config: {
                numberOfVideos: 1,
                referenceImages: referenceImagesPayload,
                resolution: '720p',
                aspectRatio: '16:9',
            },
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await videoAI.operations.getVideosOperation({ operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (videoUri) {
            const apiKey = process.env.API_KEY;
            if (!apiKey) throw new Error("API key is not available.");
            const response = await fetch(`${videoUri}&key=${apiKey}`);
            if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);
            const videoBlob = await response.blob();
            return URL.createObjectURL(videoBlob);
        }

        throw new Error("Video generation did not return a valid URI.");
    } catch (error) {
        console.error("Error generating video:", error);
        throw new Error("Failed to generate video via Gemini API.");
    }
}

export async function generateVoiceOver(script: string, voice: string): Promise<string> {
    // FIX: Instantiate a new client here to ensure the latest API key is used.
    const ttsAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ttsAI.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            const pcmData = decodeBase64(base64Audio);
            const wavBlob = createWavBlob(pcmData);
            return URL.createObjectURL(wavBlob);
        }
        throw new Error("No audio data was returned from the API.");
    } catch (error) {
        console.error("Error generating voice-over:", error);
        throw new Error("Failed to generate voice-over via Gemini API.");
    }
}