import { GoogleGenAI, Modality } from "@google/genai";
import type { Character, SceneDetails } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export function buildPrompt(characters: Character[], scene: SceneDetails): string {
  let prompt = `A ${scene.shotType}, 16:9 aspect ratio. Style: ${scene.imageStyle}. In ${scene.location}, the scene is: ${scene.environment}. `;

  scene.actors.forEach(actor => {
    if (actor.characterId !== 'temporary') {
      const mainChar = characters.find(c => c.id === actor.characterId);
      if (mainChar) {
        prompt += `The character ${mainChar.name} (${mainChar.role}, age ${mainChar.age}) is present. They have ${mainChar.appearance.eyes} eyes, ${mainChar.appearance.skin} skin, and ${mainChar.appearance.hair} hair. They are wearing a ${mainChar.outfit.upper}, ${mainChar.outfit.lower}, and ${mainChar.outfit.footwear}. Action: ${actor.description}. `;
      }
    } else {
      prompt += `A temporary character is present. Description and action: ${actor.description}. `;
    }
  });

  return prompt.trim();
}

export async function generateImageForScene(prompt: string): Promise<string> {
  const model = 'gemini-2.5-flash-image';

  console.log("Generating with Prompt:", prompt);

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error("No image data found in the response.");

  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    throw new Error("Failed to generate image. Please check your configuration and try again.");
  }
}