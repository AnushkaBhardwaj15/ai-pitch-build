import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  openaiClient ??= new OpenAI();
  return openaiClient;
}

/**
 * Generate a slide illustration image using OpenAI gpt-image-1-mini.
 * Supports USE_PLACEHOLDER_IMAGES=true dev mode to skip image API costs.
 */
export async function generateSlideImage(prompt: string): Promise<Buffer> {
  if (process.env.USE_PLACEHOLDER_IMAGES === "true") {
    const res = await fetch("https://picsum.photos/1280/720");
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const openai = getOpenAI();
  const response = await openai.images.generate({
    model: "gpt-image-1-mini",
    prompt,
    size: "1024x1024",
  });

  const b64Json = response.data?.[0]?.b64_json;
  if (!b64Json) {
    throw new Error("OpenAI image generation failed to return b64_json");
  }

  return Buffer.from(b64Json, "base64");
}
