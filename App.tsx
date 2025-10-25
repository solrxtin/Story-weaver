import React, { useState, useEffect } from 'react';
import { CharacterForm } from './components/CharacterForm';
import { CharacterList } from './components/CharacterList';
import { SceneInput } from './components/SceneInput';
import { StoryOutput } from './components/StoryOutput';
import type { Character, NewCharacter, SceneDetails, StoryboardImage } from './types';
import { composeImagePrompt, generateImage, generateVideoFromSequence, generateVoiceOver } from './services/geminiService';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [composedPrompt, setComposedPrompt] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const [isPromptLoading, setIsPromptLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [storyboardImages, setStoryboardImages] = useState<StoryboardImage[]>([]);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [previewLoadingVoice, setPreviewLoadingVoice] = useState<string | null>(null);
  
  const [hasSelectedApiKey, setHasSelectedApiKey] = useState(false);


  const checkApiKey = async (): Promise<boolean> => {
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setHasSelectedApiKey(hasKey);
      return hasKey;
    }
    return false;
  };

  const selectApiKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      // Assume success to improve UX and avoid race conditions
      setHasSelectedApiKey(true);
      setVideoError(null);
      setAudioError(null);
    }
  };
    
  useEffect(() => {
    checkApiKey();
  }, []);

  const handleAddCharacter = (newCharacter: NewCharacter) => {
    const characterWithId: Character = { ...newCharacter, id: crypto.randomUUID() };
    setCharacters(prev => [...prev, characterWithId]);
  };

  const handleDeleteCharacter = (id: string) => {
    setCharacters(prev => prev.filter(char => char.id !== id));
  };

  const handleComposePrompt = async (scene: SceneDetails) => {
    setIsPromptLoading(true);
    setError(null);
    setComposedPrompt(null);
    setGeneratedImage(null);
    try {
      const prompt = await composeImagePrompt(scene, characters);
      setComposedPrompt(prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred.');
    } finally {
      setIsPromptLoading(false);
    }
  };
  
  const handleGenerateImage = async (prompt: string) => {
    setIsImageLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt);
      setGeneratedImage(imageUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred during image generation.');
    } finally {
      setIsImageLoading(false);
    }
  }

  const handleImageUpload = (imageData: string) => {
    setGeneratedImage(imageData);
    setComposedPrompt(null);
    setError(null);
  };

  const handleGenerateVideo = async (prompt: string) => {
    const keySelected = await checkApiKey();
    if (!keySelected) return;

    if (storyboardImages.length === 0) {
      setVideoError("Please upload images to the storyboard first.");
      return;
    }

    setIsVideoLoading(true);
    setVideoError(null);
    setGeneratedVideo(null);

    try {
        const base64Images = storyboardImages.map(img => img.data);
        const videoUrl = await generateVideoFromSequence(prompt, base64Images);
        setGeneratedVideo(videoUrl);
    } catch (e) {
        if (e instanceof Error && (e.message.includes("not found") || e.message.includes("API key"))) {
            setHasSelectedApiKey(false);
            setVideoError("API Key error. Please select a valid API key and try again.");
        } else {
            setVideoError(e instanceof Error ? e.message : 'An unknown error occurred during video generation.');
        }
    } finally {
        setIsVideoLoading(false);
    }
  };

  const handleGenerateAudio = async (script: string, voice: string) => {
    const keySelected = await checkApiKey();
    if (!keySelected) {
      setAudioError("Please select an API key to generate audio.");
      return;
    }

    setIsAudioLoading(true);
    setAudioError(null);
    setGeneratedAudio(null);

    try {
        const audioUrl = await generateVoiceOver(script, voice);
        setGeneratedAudio(audioUrl);
    } catch (e) {
        if (e instanceof Error && (e.message.includes("not found") || e.message.includes("API key"))) {
            setHasSelectedApiKey(false);
            setAudioError("API Key error. Please select a valid API key and try again.");
        } else {
            setAudioError(e instanceof Error ? e.message : 'An unknown error occurred during audio generation.');
        }
    } finally {
        setIsAudioLoading(false);
    }
  };

  const handlePreviewVoice = async (voice: string) => {
    const keySelected = await checkApiKey();
    if (!keySelected) {
      setAudioError("Please select an API key to preview voices.");
      return;
    }
    
    setPreviewLoadingVoice(voice);
    setAudioError(null);
    try {
        const audioUrl = await generateVoiceOver("Hello, you can use my voice for your story.", voice);
        const audio = new Audio(audioUrl);
        audio.play();
    } catch (e) {
       if (e instanceof Error && (e.message.includes("not found") || e.message.includes("API key"))) {
            setHasSelectedApiKey(false);
            setAudioError("API Key error. Please select a valid API key and try again.");
        } else {
            setAudioError(e instanceof Error ? e.message : 'An unknown error occurred during voice preview.');
        }
    } finally {
        setPreviewLoadingVoice(null);
    }
  };


  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-indigo-400">AI Storyboard Assistant</h1>
          <p className="text-lg text-gray-400 mt-2">Create characters, compose scenes, and bring your story to life with AI.</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <CharacterForm onAddCharacter={handleAddCharacter} />
            <CharacterList characters={characters} onDeleteCharacter={handleDeleteCharacter} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-8">
            <SceneInput onComposePrompt={handleComposePrompt} characters={characters} />
            <StoryOutput 
              prompt={composedPrompt}
              onPromptChange={setComposedPrompt}
              isLoading={isPromptLoading}
              error={error}
              onGenerateImage={handleGenerateImage}
              imageUrl={generatedImage}
              isImageLoading={isImageLoading}
              onImageUpload={handleImageUpload}
              onGenerateVideo={handleGenerateVideo}
              videoUrl={generatedVideo}
              isVideoLoading={isVideoLoading}
              videoError={videoError}
              hasSelectedApiKey={hasSelectedApiKey}
              onSelectApiKey={selectApiKey}
              storyboardImages={storyboardImages}
              onStoryboardImagesChange={setStoryboardImages}
              onGenerateAudio={handleGenerateAudio}
              audioUrl={generatedAudio}
              isAudioLoading={isAudioLoading}
              audioError={audioError}
              onPreviewVoice={handlePreviewVoice}
              previewLoadingVoice={previewLoadingVoice}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;