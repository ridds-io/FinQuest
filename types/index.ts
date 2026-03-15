export interface UserState {
  id?: string;
  email?: string;
  gold: number;
  current_module: string;
  level: number;
  created_at?: string;
}

export interface GameSession {
  id: string;
  user_id: string;
  module: string;
  state: Record<string, unknown>;
  score: number;
  completed: boolean;
}

export interface ScenarioInput {
  module: string;
  playerState: { gold: number; level: number; avatar?: string };
}

export interface ScenarioChoice {
  label: string;
  cost: number;
  outcome?: { debt?: number; skill?: string; xp?: number; gold?: number };
}

export interface GeneratedScenario {
  situation: string;
  choices: string[];
  costs: number[];
  outcomes: Array<{ debt?: number; skill?: string; xp?: number; gold?: number }>;
}

export interface GameState {
  gold: number;
  level: number;
  xp?: number;
  avatar?: { emoji: string; name: string; type: string };
  current_module?: string;
}

export interface AvatarOption {
  emoji: string;
  name: string;
  type: string;
  detail: string;
  gold: number;
  stat: string;
}
