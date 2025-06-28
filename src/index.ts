/**
 * Main entry point for the Beluga Discord Bot
 * Based on Discord's official Cloudflare Workers sample app
 * Enhanced with comprehensive security and audit logging
 */

import { InteractionType, InteractionResponseType, createErrorResponse } from './utils/discord';
import { handleRegisterCommand } from './handlers/register';
import { 
  extractSecurityContext,
  verifyDiscordRequestSecure,
  createSecurityHeaders,
  withTimeout,
  cleanupRateLimits,
  type SecurityContext 
} from './middleware/security';
import { AuditLogger } from './utils/audit';
import type { DiscordInteraction } from './types/discord';

export interface Env {
  DISCORD_TOKEN: string;
  DISCORD_PUBLIC_KEY: string;
  DISCORD_APPLICATION_ID: string;
  DATABASE_URL?: string;
  GOOGLE_SHEETS_API_KEY?: string;
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const startTime = Date.now();
    let context: SecurityContext | undefined;
    let audit: AuditLogger | undefined;

    try {
      // Extract security context and initialize audit logger
      context = extractSecurityContext(request);
      audit = new AuditLogger(env.ENVIRONMENT || 'development');
      
      // Cleanup rate limits periodically
      if (Math.random() < 0.01) { // 1% chance to cleanup on each request
        cleanupRateLimits();
      }

      // Log request received
      audit.logRequestReceived(context, request.method, new URL(request.url).pathname);

      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        audit.logHealthCheck(context);
        return new Response(null, {
          headers: {
            ...createSecurityHeaders(),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers':
              'Content-Type, Authorization, X-Signature-Ed25519, X-Signature-Timestamp',
          },
        });
      }

      // Handle GET request for health check
      if (request.method === 'GET') {
        audit.logHealthCheck(context);
        return new Response('Beluga Discord Bot is running!', {
          headers: { 
            'Content-Type': 'text/plain',
            ...createSecurityHeaders(),
          },
        });
      }

      // Only handle POST requests for Discord interactions
      if (request.method !== 'POST') {
        audit.logRequestRejected(context, 'Method not allowed');
        return new Response('Method not allowed', { 
          status: 405,
          headers: createSecurityHeaders(),
        });
      }

      // Enhanced Discord request verification with security checks
      const validationResult = await withTimeout(
        verifyDiscordRequestSecure(request, env.DISCORD_PUBLIC_KEY, context)
      );

      if (!validationResult.isValid) {
        const error = validationResult.error || 'Request validation failed';
        audit.logRequestRejected(context, error);
        
        // Log security violations for specific errors
        if (error.includes('rate limit') || error.includes('signature') || error.includes('timestamp')) {
          audit.logSecurityViolation(context, 'REQUEST_VALIDATION', error);
        }

        return new Response('Unauthorized', { 
          status: 401,
          headers: createSecurityHeaders(),
        });
      }

      audit.logRequestVerified(context);

      // Parse interaction with timeout and error handling
      let interaction: DiscordInteraction;
      try {
        interaction = await withTimeout(request.json()) as DiscordInteraction;
      } catch (error) {
        const errorMsg = 'Failed to parse interaction JSON';
        audit.logError(context, errorMsg, { parseError: error instanceof Error ? error.message : 'Unknown' });
        return createErrorResponse('Invalid request format');
      }

      // Handle ping from Discord
      if (interaction.type === InteractionType.PING) {
        const responseTime = Date.now() - startTime;
        audit.logCommandExecution(context, interaction, true, responseTime);
        
        return new Response(JSON.stringify({ type: InteractionResponseType.PONG }), {
          headers: { 
            'Content-Type': 'application/json',
            ...createSecurityHeaders(),
          },
        });
      }

      // Handle application commands
      if (interaction.type === InteractionType.APPLICATION_COMMAND) {
        const { name } = interaction.data ?? { name: '' };
        const commandStartTime = Date.now();

        try {
          let response: Response;
          
          switch (name) {
            case 'register':
              response = await withTimeout(handleRegisterCommand(interaction, env));
              break;

            default:
              audit.logError(context, `Unknown command: ${name}`, { commandName: name });
              response = createErrorResponse('Unknown command. Please try again.');
              break;
          }

          const responseTime = Date.now() - commandStartTime;
          audit.logCommandExecution(context, interaction, true, responseTime);
          
          // Add security headers to response
          const headers = new Headers(response.headers);
          Object.entries(createSecurityHeaders()).forEach(([key, value]) => {
            headers.set(key, value);
          });
          
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          });

        } catch (error) {
          const responseTime = Date.now() - commandStartTime;
          const errorMsg = error instanceof Error ? error.message : 'Command execution failed';
          audit.logCommandExecution(context, interaction, false, responseTime, errorMsg);
          
          return createErrorResponse('An error occurred while processing your command.');
        }
      }

      // Handle unknown interaction types
      audit.logError(context, `Unknown interaction type: ${interaction.type}`, { 
        interactionType: interaction.type 
      });
      return new Response('Bad request', { 
        status: 400,
        headers: createSecurityHeaders(),
      });

    } catch (error) {
      // Global error handler
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (audit && context) {
        audit.logError(context, errorMsg, { 
          stack: error instanceof Error ? error.stack : undefined,
          responseTime: Date.now() - startTime,
        });
      } else {
        console.error('Global error (no audit context):', errorMsg);
      }

      return new Response('Internal server error', { 
        status: 500,
        headers: createSecurityHeaders(),
      });
    }
  },
};
