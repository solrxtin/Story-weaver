import React from 'react';
import { BookOpenIcon, SparklesIcon, DownloadIcon } from './icons';

interface StoryOutputProps {
  prompt: string | null;
  onPromptChange: (newPrompt: string) => void;
  imageData: string | null;
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}

export const StoryOutput: React.FC<StoryOutputProps> = ({ prompt, onPromptChange, imageData, isLoading, error, onGenerate }) => {
  
  const handleDownload = () => {
    if (!imageData) return;
    const link = document.createElement('a');
    link.href = imageData;
    link.download = 'story-weaver-scene.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
        <BookOpenIcon />
        Generation Panel
      </h2>

      <div className="flex flex-col space-y-4 flex-grow">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">
            Generated Prompt (Editable)
          </label>
          <textarea
            id="prompt"
            value={prompt ?? ''}
            onChange={(e) => onPromptChange(e.target.value)}
            placeholder="Compose a prompt using the panel on the left..."
            rows={5}
            className="w-full bg-gray-900/50 border-gray-600 rounded-md p-2 resize-y focus:ring-indigo-500 focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-gray-800"
            disabled={isLoading}
          />
        </div>

        <button
          onClick={onGenerate}
          disabled={isLoading || !prompt}
          className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Weaving...
            </>
          ) : (
            <>
              <SparklesIcon />
              Generate Image
            </>
          )}
        </button>
        
        <div className="bg-gray-900/50 p-4 rounded-md flex-grow min-h-[16rem] flex items-center justify-center overflow-hidden">
          {isLoading && (
             <div className="text-center text-gray-400">
                <svg className="animate-spin h-8 w-8 text-white mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating image...
            </div>
          )}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {!isLoading && !error && imageData && (
             <div className="relative w-full h-full group">
              <img src={imageData} alt="Generated scene" className="object-contain w-full h-full rounded" />
              <button
                onClick={handleDownload}
                className="absolute top-2 right-2 p-2 bg-gray-800/70 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-indigo-600"
                aria-label="Download Image"
              >
                <DownloadIcon />
              </button>
            </div>
          )}
          {!isLoading && !error && !imageData && (
            <p className="text-gray-500 text-center">Your generated scene image will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};