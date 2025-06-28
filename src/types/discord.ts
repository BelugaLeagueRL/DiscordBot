/**
 * Discord API type definitions
 */

export interface DiscordInteraction {
  readonly type: number;
  readonly data?: {
    readonly name: string;
    readonly options?: ReadonlyArray<{
      readonly name: string;
      readonly value: string;
    }>;
  };
  readonly member?: {
    readonly user?: {
      readonly id: string;
    };
  };
  readonly user?: {
    readonly id: string;
  };
}

export interface InteractionResponse {
  readonly type: number;
  readonly data?: {
    readonly content: string;
    readonly flags?: number;
  };
}
