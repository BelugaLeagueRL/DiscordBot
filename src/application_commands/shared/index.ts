/**
 * Shared utilities for Discord application commands
 * Barrel export for clean imports
 */

export { validateChannelRestriction } from './channel-validator';
export type { ChannelValidationResult } from './channel-validator';

export { validateAdminChannelRestriction } from './admin-channel-validator';
export type { AdminChannelValidationResult } from './admin-channel-validator';

export { validateAdminPermissions } from './admin-permissions';
export type { AdminPermissionResult } from './admin-permissions';
