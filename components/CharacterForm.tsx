import React, { useState } from 'react';
import type { NewCharacter } from '../types';
import { PlusIcon, UserIcon } from './icons';

interface CharacterFormProps {
  onAddCharacter: (character: NewCharacter) => void;
}

const initialFormState: NewCharacter = {
  name: '',
  role: '',
  age: '',
  appearance: { eyes: '', skin: '', hair: '' },
  outfit: { upper: '', lower: '', footwear: '' },
  props: '',
};

export const CharacterForm: React.FC<CharacterFormProps> = ({ onAddCharacter }) => {
  const [formState, setFormState] = useState<NewCharacter>(initialFormState);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormState(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormState(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name.trim() || !formState.role.trim()) {
      alert('Please fill out at least the Name and Role fields.');
      return;
    }
    onAddCharacter(formState);
    setFormState(initialFormState);
  };

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
        <UserIcon />
        Create Character
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
              <input id="name" name="name" type="text" value={formState.name} onChange={handleChange} placeholder="e.g., Chelsea Perkins" className="mt-1 block w-full bg-gray-900/50 border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-300">Role</label>
              <input id="role" name="role" type="text" value={formState.role} onChange={handleChange} placeholder="e.g., Protagonist" className="mt-1 block w-full bg-gray-900/50 border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
            </div>
        </div>
         <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-300">Age</label>
            <input id="age" name="age" type="text" value={formState.age} onChange={handleChange} placeholder="e.g., 30" className="mt-1 block w-full bg-gray-900/50 border-gray-600 rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        
        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-sm font-medium text-gray-300 px-2">Base Appearance</legend>
            <div className="space-y-2">
                <input name="appearance.eyes" value={formState.appearance.eyes} onChange={handleChange} placeholder="Eyes: Sharp, focused hazel" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
                <input name="appearance.skin" value={formState.appearance.skin} onChange={handleChange} placeholder="Skin: Fair ivory tone" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
                <input name="appearance.hair" value={formState.appearance.hair} onChange={handleChange} placeholder="Hair: Long, straight brunette" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
            </div>
        </fieldset>

        <fieldset className="border border-gray-700 p-4 rounded-md">
            <legend className="text-sm font-medium text-gray-300 px-2">Default Outfit</legend>
            <div className="space-y-2">
                <input name="outfit.upper" value={formState.outfit.upper} onChange={handleChange} placeholder="Upper: Heather-gray sweatshirt" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
                <input name="outfit.lower" value={formState.outfit.lower} onChange={handleChange} placeholder="Lower: Black fleece sweatpants" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
                <input name="outfit.footwear" value={formState.outfit.footwear} onChange={handleChange} placeholder="Footwear: White athletic socks" className="block w-full bg-gray-900/50 border-gray-600 rounded-md p-2"/>
            </div>
        </fieldset>

         <div>
          <label htmlFor="props" className="block text-sm font-medium text-gray-300">Props & Loadout</label>
          <textarea id="props" name="props" value={formState.props} onChange={handleChange} placeholder="e.g., Smartphone, 9mm handgun, Laptop..." rows={3} className="mt-1 block w-full bg-gray-900/50 border-gray-600 rounded-md p-2 resize-y"/>
        </div>
        
        <button type="submit" className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-colors">
          <PlusIcon />
          Add Character
        </button>
      </form>
    </div>
  );
};
