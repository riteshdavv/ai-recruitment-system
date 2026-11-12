import Vapi from "@vapi-ai/web";

let vapiInstance = null;

export const getVapiClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;

  if (!apiKey) {
    // Vapi is optional; the app prioritizes LiveKit WebRTC and Browser-Native voice
    return null;
  }

  if (!vapiInstance) {
    vapiInstance = new Vapi(apiKey);
  }

  return vapiInstance;
};
