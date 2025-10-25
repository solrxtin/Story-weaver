import React from 'react';
import type { Character } from '../types';
import { TrashIcon, UserGroupIcon } from './icons';

interface CharacterListProps {
  characters: Character[];
  onDeleteCharacter: (id: string) => void;
}

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  if (!value) return null;
  return <p><strong className="text-gray-300 capitalize">{label}:</strong> {value}</p>;
};

const CharacterCard: React.FC<{ character: Character; onDelete: (id: string) => void }> = ({ character, onDelete }) => (
  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 relative group">
    <button
      onClick={() => onDelete(character.id)}
      className="absolute top-2 right-2 p-1 bg-red-600/50 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-500"
      aria-label={`Delete ${character.name}`}
    >
      <TrashIcon />
    </button>
    <div className="flex justify-between items-start">
        <div>
            <h3 className="font-bold text-lg text-purple-400">{character.name}</h3>
            <p className="text-sm text-indigo-300">{character.role}</p>
        </div>
        {character.age && <p className="text-sm text-gray-400">Age: {character.age}</p>}
    </div>
    <div className="mt-3 space-y-3 text-sm text-gray-400">
        <div>
            <h4 className="font-semibold text-gray-300 border-b border-gray-700/50 mb-1">Appearance</h4>
            <DetailRow label="eyes" value={character.appearance.eyes} />
            <DetailRow label="skin" value={character.appearance.skin} />
            <DetailRow label="hair" value={character.appearance.hair} />
        </div>
        <div>
            <h4 className="font-semibold text-gray-300 border-b border-gray-700/50 mb-1">Outfit</h4>
            <DetailRow label="upper" value={character.outfit.upper} />
            <DetailRow label="lower" value={character.outfit.lower} />
            <DetailRow label="footwear" value={character.outfit.footwear} />
        </div>
        {character.props && (
            <div>
                <h4 className="font-semibold text-gray-300 border-b border-gray-700/50 mb-1">Props</h4>
                <p>{character.props}</p>
            </div>
        )}
    </div>
  </div>
);

export const CharacterList: React.FC<CharacterListProps> = ({ characters, onDeleteCharacter }) => {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 backdrop-blur-sm">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-indigo-400">
        <UserGroupIcon />
        Character Roster
      </h2>
      {characters.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No characters added yet.</p>
      ) : (
        <div className="space-y-4 max-h-[40rem] overflow-y-auto pr-2">
          {characters.map(char => (
            <CharacterCard key={char.id} character={char} onDelete={onDeleteCharacter} />
          ))}
        </div>
      )}
    </div>
  );
};
