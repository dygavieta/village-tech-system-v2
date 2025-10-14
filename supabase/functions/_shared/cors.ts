/**
 * CORS Headers Utility for Edge Functions
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

export function createCorsResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function createErrorResponse(error: string, status = 400): Response {
  return createCorsResponse({ error }, status);
}

export function createSuccessResponse(data: unknown, status = 200): Response {
  return createCorsResponse(data, status);
}
