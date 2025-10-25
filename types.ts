export interface Character {
  id: string;
  name: string;
  role: string;
  age: string;
  appearance: {
    eyes: string;
    skin: string;
    hair: string;
  };
  outfit: {
    upper: string;
    lower: string;
    footwear: string;
  };
  props: string;
}

export type NewCharacter = Omit<Character, 'id'>;

export interface SceneActor {
  // Uses a unique key for list rendering in React, not the character's ID
  key: string; 
  characterId: string | 'temporary'; // 'temporary' for one-off characters
  description: string; // "standing at the edge of a line of police tape..."
}

export interface SceneDetails {
  location: string;
  environment: string;
  shotType: string;
  imageStyle: string;
  actors: SceneActor[];
}
