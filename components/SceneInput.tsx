import React, { useState, useCallback, useRef } from 'react';
import type { SceneDetails, SceneActor, Character } from '../types';
import { PenIcon, PlusIcon, TrashIcon, UploadIcon, ImageIcon } from './icons';

interface SceneInputProps {
  onComposePrompt: (scene: SceneDetails) => void;
  characters: Character[];
}

const initialSceneState: SceneDetails = {
  location: '',
  environment: '',
  shotType: 'wide shot',
  imageStyle: 'cinematic anime, soft realism, moderate realism, textured shadows',
  actors: [],
  referenceImage: undefined,
};

export const SceneInput: React.FC<SceneInputProps> = ({ onComposePrompt, characters }) => {
  const [scene, setScene] = useState<SceneDetails>(initialSceneState);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleSceneChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setScene(prev => ({...prev, [e.target.name]: e.target.value }));
  };
  
  const handleActorChange = (key: string, field: keyof SceneActor, value: string) => {
    setScene(prev => ({
      ...prev,
      actors: prev.actors.map(actor => actor.key === key ? { ...actor, [field]: value } : actor)
    }));
  };
  
  const addActor = () => {
    const newActor: SceneActor = { key: crypto.randomUUID(), characterId: 'temporary', description: '' };
    setScene(prev => ({ ...prev, actors: [...prev.actors, newActor] }));
  };
  
  const removeActor = (key: string) => {
    setScene(prev => ({...prev, actors: prev.actors.filter(actor => actor.key !== key)}));
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        // FIX: Explicitly type `f` as `File` to resolve type inference issues.
        const file = Array.from(e.dataTransfer.files).find((f: File) => f.type.startsWith('image/'));
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            if (loadEvent.target?.result) {
              setScene(prev => ({...prev, referenceImage: loadEvent.target!.result as string }));
            }
          };
          reader.readAsDataURL(file);
        }
        e.dataTransfer.clearData();
      }
  }, []);

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

  const removeReferenceImage = () => {
    setScene(prev => ({...prev, referenceImage: undefined}));
  }

  return (
    <div 
      className="relative bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm h-full flex flex-col space-y-4"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      {isDragging && (
        <div className="absolute inset-0 bg-gray-900/80 flex flex-col justify-center items-center rounded-lg z-10 pointer-events-none border-2 border-dashed border-indigo-400">
            <UploadIcon className="h-10 w-10 text-indigo-400" />
            <p className="mt-2 text-lg font-semibold">Drop Reference Image</p>
        </div>
      )}
      <h2 className="text-xl font-semibold flex items-center gap-2 text-indigo-400">
        <PenIcon />
        Scene Composer
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-300">Location</label>
          <input name="location" value={scene.location} onChange={handleSceneChange} placeholder="e.g., Cuyahoga Valley Woods" className="mt-1 w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-300">Shot Type</label>
          <input name="shotType" value={scene.shotType} onChange={handleSceneChange} placeholder="e.g., wide shot, close-up" className="mt-1 w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-300">Environment Description</label>
        <textarea name="environment" value={scene.environment} onChange={handleSceneChange} placeholder="e.g., a clearing, floor covered in damp leaves, thick morning fog..." rows={3} className="mt-1 w-full bg-gray-900/50 border-gray-600 rounded-md p-2 resize-y"/>
      </div>
       
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-300">Actors in Scene</h3>
          <div className="space-y-3 mt-2">
            {scene.actors.map((actor) => (
              <div key={actor.key} className="flex gap-2 items-start bg-gray-900/50 p-3 rounded-md">
                <div className="flex-grow space-y-2">
                  <select 
                    value={actor.characterId}
                    onChange={(e) => handleActorChange(actor.key, 'characterId', e.target.value)}
                    className="w-full bg-gray-800 border-gray-600 rounded-md p-2"
                  >
                    <option value="temporary">Temporary Character</option>
                    {characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <textarea 
                    value={actor.description} 
                    onChange={(e) => handleActorChange(actor.key, 'description', e.target.value)}
                    placeholder={actor.characterId === 'temporary' ? "Describe temporary character and action..." : "Describe action..."}
                    rows={2} 
                    className="w-full bg-gray-800 border-gray-600 rounded-md p-2 resize-y"
                  />
                </div>
                <button onClick={() => removeActor(actor.key)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-md"><TrashIcon /></button>
              </div>
            ))}
            <button onClick={addActor} className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-dashed border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700/50 transition-colors">
              <PlusIcon /> Add Actor
            </button>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-300">Reference Image</h3>
          <div className="mt-2 flex items-center justify-center w-full h-full min-h-[150px] bg-gray-900/50 rounded-md border-2 border-dashed border-gray-600">
            {scene.referenceImage ? (
              <div className="relative group">
                <img src={scene.referenceImage} alt="Scene reference" className="max-h-48 rounded-md" />
                 <button onClick={removeReferenceImage} className="absolute top-1 right-1 p-1 bg-red-600/70 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><TrashIcon /></button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <ImageIcon className="mx-auto h-8 w-8" />
                <p className="mt-2 text-sm">Drag & drop an image</p>
              </div>
            )}
          </div>
        </div>
      </div>

       <div>
        <label className="text-sm font-medium text-gray-300">Image Style</label>
        <input name="imageStyle" value={scene.imageStyle} onChange={handleSceneChange} placeholder="e.g., cinematic anime, soft realism..." className="mt-1 w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
      </div>

      <button
        onClick={() => onComposePrompt(scene)}
        disabled={characters.length === 0}
        className="mt-auto w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all"
      >
        <PenIcon />
        Compose Prompt
      </button>
       {!characters.length && (
          <p className="text-xs text-yellow-400 text-center mt-2">Add at least one character to the roster to compose a prompt.</p>
        )}
    </div>
  );
};