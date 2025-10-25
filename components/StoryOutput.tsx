import React, { useState, useRef, useCallback } from 'react';
import type { StoryboardImage } from '../types';
import { SparklesIcon, ImageIcon, LoaderIcon, CopyIcon, VideoIcon, UploadIcon, TrashIcon, AudioIcon, DownloadIcon, PlayIcon } from './icons';

interface StoryOutputProps {
  prompt: string | null;
  onPromptChange: (newPrompt: string) => void;
  isLoading: boolean;
  error: string | null;
  onGenerateImage: (prompt: string) => void;
  imageUrl: string | null;
  isImageLoading: boolean;
  onImageUpload: (imageData: string) => void;
  onGenerateVideo: (prompt: string) => void;
  videoUrl: string | null;
  isVideoLoading: boolean;
  videoError: string | null;
  hasSelectedApiKey: boolean;
  onSelectApiKey: () => void;
  storyboardImages: StoryboardImage[];
  onStoryboardImagesChange: React.Dispatch<React.SetStateAction<StoryboardImage[]>>;
  onGenerateAudio: (script: string, voice: string) => void;
  audioUrl: string | null;
  isAudioLoading: boolean;
  audioError: string | null;
  onPreviewVoice: (voiceId: string) => void;
  previewLoadingVoice: string | null;
}

const VOICES = [
    { name: 'Zephyr', id: 'Zephyr' },
    { name: 'Kore', id: 'Kore' },
    { name: 'Puck', id: 'Puck' },
    { name: 'Charon', id: 'Charon' },
    { name: 'Fenrir', id: 'Fenrir' },
];

export const StoryOutput: React.FC<StoryOutputProps> = ({
  prompt, onPromptChange, isLoading, error, onGenerateImage, imageUrl, isImageLoading, onImageUpload,
  onGenerateVideo, videoUrl, isVideoLoading, videoError, hasSelectedApiKey, onSelectApiKey,
  storyboardImages, onStoryboardImagesChange,
  onGenerateAudio, audioUrl, isAudioLoading, audioError,
  onPreviewVoice, previewLoadingVoice
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'video' | 'audio'>('image');
  const [copied, setCopied] = useState(false);
  const [videoPrompt, setVideoPrompt] = useState('');
  const [audioScript, setAudioScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const draggedItem = useRef<number | null>(null);
  const draggedOverItem = useRef<number | null>(null);

  const handleCopy = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVideoFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // FIX: Explicitly type `file` as `File` to resolve type inference issues.
      const files = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          if (loadEvent.target?.result) {
            onStoryboardImagesChange(prev => [...prev, { key: crypto.randomUUID(), data: loadEvent.target!.result as string }]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  }, [onStoryboardImagesChange]);

  const handleImageFileDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // FIX: Explicitly type `f` as `File` to resolve type inference issues.
        const file = Array.from(e.dataTransfer.files).find((f: File) => f.type.startsWith('image/'));
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                if (loadEvent.target?.result) {
                    onImageUpload(loadEvent.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    }
  }, [onImageUpload]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (activeTab === 'image') {
          handleImageFileDrop(e);
      } else if (activeTab === 'video') {
          handleVideoFileDrop(e);
      }
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        e.dataTransfer.clearData();
      }
  }, [activeTab, handleImageFileDrop, handleVideoFileDrop]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSort = () => {
    if (draggedItem.current === null || draggedOverItem.current === null) return;
    const items = [...storyboardImages];
    const [reorderedItem] = items.splice(draggedItem.current, 1);
    items.splice(draggedOverItem.current, 0, reorderedItem);
    draggedItem.current = null;
    draggedOverItem.current = null;
    onStoryboardImagesChange(items);
  };
  
  const removeStoryboardImage = (key: string) => {
      onStoryboardImagesChange(storyboardImages.filter(img => img.key !== key));
  };

  const TabButton: React.FC<{ tabId: 'image' | 'video' | 'audio'; children: React.ReactNode }> = ({ tabId, children }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tabId ? 'bg-gray-800/50 text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:bg-gray-700/30'}`}
    >
      {children}
    </button>
  );

  const renderImageTab = () => (
    <div className={`relative space-y-4 h-full p-1 -m-1 rounded-lg transition-colors ${isDragging && activeTab === 'image' ? 'border-2 border-dashed border-indigo-400 bg-gray-700/50' : ''}`}>
      {isDragging && activeTab === 'image' && (
        <div className="absolute inset-0 bg-gray-900/80 flex flex-col justify-center items-center rounded-lg z-10 pointer-events-none">
            <UploadIcon className="h-10 w-10 text-indigo-400" />
            <p className="mt-2 text-lg font-semibold">Drop image to upload</p>
        </div>
      )}
      {isLoading && <div className="flex flex-col items-center justify-center p-8"><LoaderIcon /><p className="mt-2">Composing prompt...</p></div>}
      {error && <div className="p-4 bg-red-900/20 rounded-lg text-red-300">{error}</div>}
      {!prompt && !isLoading && !error && !imageUrl && (
        <div className="flex flex-col items-center justify-center text-center p-8 h-full">
          <SparklesIcon /><p className="mt-2 text-lg font-semibold">Ready to Create</p><p className="text-sm text-gray-400">Compose a scene to generate a prompt.</p>
          <p className="text-gray-500 mt-4 text-xs">Or drag & drop an image here.</p>
        </div>
      )}
      {prompt && (
        <>
          <div>
            <h3 className="text-lg font-semibold text-gray-300">Generated Prompt</h3>
            <div className="relative mt-2">
              <textarea value={prompt} onChange={(e) => onPromptChange(e.target.value)} rows={5} className="w-full bg-gray-900/50 p-4 rounded-md border border-gray-700 text-gray-300 pr-10 resize-y"/>
              <button onClick={handleCopy} className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white rounded-md" title="Copy prompt">{copied ? 'Copied!' : <CopyIcon />}</button>
            </div>
          </div>
          <button onClick={() => onGenerateImage(prompt)} disabled={isImageLoading} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600">
            {isImageLoading ? <><LoaderIcon/> Generating...</> : <><ImageIcon /> Generate Image</>}
          </button>
        </>
      )}
      {isImageLoading && !imageUrl && <p className="text-center text-gray-400">Generating image...</p>}
      {imageUrl && (
        <div className="mt-4 relative group">
          <img src={imageUrl} alt="Generated scene" className="rounded-lg border-2 border-gray-700 w-full" />
           <a href={imageUrl} download="generated-scene.jpeg" className="absolute bottom-2 right-2 p-2 bg-gray-900/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800" aria-label="Download image">
             <DownloadIcon />
           </a>
        </div>
      )}
    </div>
  );

  const renderVideoTab = () => (
    <div className="space-y-4">
      {!hasSelectedApiKey && (
          <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm p-3 rounded-md flex flex-col items-center gap-2">
              <p className="text-center">Video generation requires a Google AI Studio API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Billing info</a>.</p>
              <button onClick={onSelectApiKey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Select API Key</button>
          </div>
      )}
       <div className={`p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging && activeTab === 'video' ? 'border-indigo-400 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'}`}>
         {storyboardImages.length === 0 ? (
           <div className="text-center text-gray-400 py-8">
             <UploadIcon className="mx-auto h-8 w-8"/><p className="mt-2 font-semibold">Drag & drop images here</p><p className="text-xs">Up to 3 images to form a sequence</p>
           </div>
         ) : (
           <div className="grid grid-cols-3 gap-2">
             {storyboardImages.map((image, index) => (
                <div key={image.key} className="relative group" draggable onDragStart={() => draggedItem.current = index} onDragEnter={() => draggedOverItem.current = index} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()}>
                  <img src={image.data} alt={`storyboard frame ${index+1}`} className="rounded-md aspect-video object-cover"/>
                  <button onClick={() => removeStoryboardImage(image.key)} className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
                </div>
             ))}
           </div>
         )}
       </div>
       <div>
        <label className="text-lg font-semibold text-gray-300">Animation Prompt</label>
        <textarea value={videoPrompt} onChange={e => setVideoPrompt(e.target.value)} rows={3} placeholder="Describe the animation, e.g., 'Animate these images into a smooth sequence...'" className="mt-2 w-full bg-gray-900/50 p-3 rounded-md border border-gray-700 resize-y"/>
       </div>
       <button onClick={() => onGenerateVideo(videoPrompt)} disabled={isVideoLoading || !hasSelectedApiKey || storyboardImages.length === 0} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600">
         {isVideoLoading ? <><LoaderIcon/> Generating Video...</> : <><VideoIcon /> Generate Video</>}
       </button>
        {videoError && <div className="p-4 bg-red-900/20 rounded-lg text-red-300">{videoError}</div>}
        {isVideoLoading && !videoUrl && <p className="text-center text-gray-400">Generating video, this may take a few minutes...</p>}
        {videoUrl && (
          <div className="mt-4"><video src={videoUrl} controls autoPlay loop className="rounded-lg border-2 border-gray-700 w-full" /></div>
        )}
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-4">
      {!hasSelectedApiKey && (
          <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-300 text-sm p-3 rounded-md flex flex-col items-center gap-2">
              <p className="text-center">Audio generation requires a Google AI Studio API key. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline">Billing info</a>.</p>
              <button onClick={onSelectApiKey} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Select API Key</button>
          </div>
      )}
       <div>
        <label htmlFor="script" className="text-lg font-semibold text-gray-300">Script</label>
        <textarea id="script" value={audioScript} onChange={e => setAudioScript(e.target.value)} rows={6} placeholder="Enter the voice-over script here..." className="mt-2 w-full bg-gray-900/50 p-3 rounded-md border border-gray-700 resize-y"/>
       </div>
       <div>
          <label className="text-lg font-semibold text-gray-300">Voice</label>
          <fieldset className="mt-2 space-y-2">
            {VOICES.map(voice => (
              <div key={voice.id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded-md">
                <label htmlFor={voice.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    id={voice.id}
                    name="voice"
                    value={voice.id}
                    checked={selectedVoice === voice.id}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-300">{voice.name}</span>
                </label>
                <button
                  onClick={() => onPreviewVoice(voice.id)}
                  disabled={previewLoadingVoice === voice.id || !hasSelectedApiKey}
                  className="p-2 text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-wait"
                  aria-label={`Preview ${voice.name} voice`}
                >
                  {previewLoadingVoice === voice.id ? <LoaderIcon /> : <PlayIcon />}
                </button>
              </div>
            ))}
          </fieldset>
       </div>
       <button onClick={() => onGenerateAudio(audioScript, selectedVoice)} disabled={isAudioLoading || !audioScript.trim() || !hasSelectedApiKey} className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600">
         {isAudioLoading ? <><LoaderIcon/> Generating Audio...</> : <><AudioIcon /> Generate Voice-over</>}
       </button>
        {audioError && <div className="p-4 bg-red-900/20 rounded-lg text-red-300">{audioError}</div>}
        {isAudioLoading && !audioUrl && <p className="text-center text-gray-400">Generating audio...</p>}
        {audioUrl && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700 flex items-center gap-4">
            <audio src={audioUrl} controls className="w-full" />
            <a href={audioUrl} download="voiceover.wav" className="p-2 text-gray-300 hover:text-white rounded-md shrink-0" aria-label="Download audio">
              <DownloadIcon />
            </a>
          </div>
        )}
    </div>
  );

  return (
    <div 
        className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm h-full flex flex-col"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
    >
      <div className="flex border-b border-gray-700 mb-4 shrink-0">
        <TabButton tabId="image"><ImageIcon/> Image</TabButton>
        <TabButton tabId="video"><VideoIcon/> Video</TabButton>
        <TabButton tabId="audio"><AudioIcon/> Audio</TabButton>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        {activeTab === 'image' && renderImageTab()}
        {activeTab === 'video' && renderVideoTab()}
        {activeTab === 'audio' && renderAudioTab()}
      </div>
    </div>
  );
};