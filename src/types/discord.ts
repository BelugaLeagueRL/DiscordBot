/**
 * Discord API type definitions
 */

export interface DiscordInteraction {
  readonly id: string;
  readonly application_id: string;
  readonly type: number;
  readonly data?: {
    readonly id: string;
    readonly name: string;
    readonly type: number;
    readonly options?: ReadonlyArray<{
      readonly name: string;
      readonly value: string;
      readonly type: number;
    }>;
  };
  readonly guild_id?: string;
  readonly channel_id?: string;
  readonly member?: {
    readonly nick?: string;
    readonly roles?: readonly string[];
    readonly user?: {
      readonly id: string;
      readonly username?: string;
      readonly discriminator?: string;
      readonly global_name?: string;
    };
  };
  readonly user?: {
    readonly id: string;
    readonly username?: string;
    readonly discriminator?: string;
    readonly global_name?: string;
  };
  readonly token: string;
  readonly version: number;
  readonly locale?: string;
  readonly guild_locale?: string;
  readonly app_permissions?: string;
}

export interface InteractionResponse {
  readonly type: number;
  readonly data?: {
    readonly content: string;
    readonly flags?: number;
  };
}
