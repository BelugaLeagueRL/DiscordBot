/**
 * Discord API type definitions
 */

export interface DiscordInteraction {
  type: number;
  data?: {
    name: string;
    options?: Array<{
      name: string;
      value: string;
    }>;
  };
  member?: {
    user?: {
      id: string;
    };
  };
  user?: {
    id: string;
  };
}

export interface InteractionResponse {
  type: number;
  data?: {
    content: string;
    flags?: number;
  };
}
