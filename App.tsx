import React, { useState, useCallback } from 'react';
import type { Character, NewCharacter, SceneDetails } from './types';
import { buildPrompt, generateImageForScene } from './services/geminiService';
import { CharacterForm } from './components/CharacterForm';
import { CharacterList } from './components/CharacterList';
import { SceneInput } from './components/SceneInput';
import { StoryOutput } from './components/StoryOutput';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const addCharacter = useCallback((character: NewCharacter) => {
    const newCharacter: Character = {
      ...character,
      id: crypto.randomUUID(),
    };
    setCharacters(prev => [...prev, newCharacter]);
  }, []);

  const deleteCharacter = useCallback((id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
  }, []);

  const handleComposePrompt = useCallback((scene: SceneDetails) => {
    if (!scene.environment.trim()) {
      setError("Please describe the environment.");
      return;
    }
     if (characters.length === 0) {
      setError("Please add at least one character to the roster first.");
      return;
    }
    setError(null);
    setGeneratedImage(null);
    const prompt = buildPrompt(characters, scene);
    setComposedPrompt(prompt);
  }, [characters]);

  const handlePromptChange = useCallback((newPrompt: string) => {
    setComposedPrompt(newPrompt);
  }, []);

  const handleGenerateImage = useCallback(async () => {
    if (!composedPrompt || !composedPrompt.trim()) {
      setError("Prompt cannot be empty. Please compose one first.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const image = await generateImageForScene(composedPrompt);
      setGeneratedImage(image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [composedPrompt]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <div className="flex items-center justify-center gap-4">
          <LogoIcon />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Story Weaver AI
          </h1>
        </div>
        <p className="text-gray-400 mt-2">Craft your narrative, one scene at a time.</p>
      </header>
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto">
        <aside className="lg:col-span-4 space-y-8">
          <CharacterForm onAddCharacter={addCharacter} />
          <CharacterList characters={characters} onDeleteCharacter={deleteCharacter} />
        </aside>

        <div className="lg:col-span-8 space-y-8">
          <SceneInput
            onComposePrompt={handleComposePrompt}
            characters={characters}
          />
          <StoryOutput
            prompt={composedPrompt}
            onPromptChange={handlePromptChange}
            imageData={generatedImage}
            isLoading={isLoading}
            error={error}
            onGenerate={handleGenerateImage}
          />
        </div>
      </main>
    </div>
  );
};

export default App;