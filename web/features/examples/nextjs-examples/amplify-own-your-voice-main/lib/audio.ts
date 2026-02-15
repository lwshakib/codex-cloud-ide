import { createClient } from "@deepgram/sdk";
import { DEEPGRAM_API_KEY } from "@/lib/env";

export const deepgramClient = createClient(DEEPGRAM_API_KEY);

export interface GenerateAudioOptions {
  text: string;
  voice?: string;
}

export interface GenerateAudioResult {
  success: boolean;
  buffer?: Buffer;
  text: string;
  error?: string;
}

async function getAudioBuffer(
  stream: ReadableStream<Uint8Array>
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Array<Uint8Array> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export const generateAudio = async ({
  text,
  voice = "aura-asteria-en",
}: GenerateAudioOptions): Promise<GenerateAudioResult> => {
  try {
    if (!DEEPGRAM_API_KEY) {
      throw new Error("Missing DEEPGRAM_API_KEY");
    }

    // Sanitize text: remove markdown code blocks if they exist
    const sanitizedText = text.replace(/```(?:json)?[\s\S]*?```/g, (match) => {
        try {
            const inner = match.replace(/```(?:json)?|```/g, "").trim();
            const parsed = JSON.parse(inner);
            return parsed.text || inner;
        } catch (e) {
            return match.replace(/```(?:json)?|```/g, "").trim();
        }
    }).trim();

    const response = await deepgramClient.speak.request(
      { text: sanitizedText },
      {
        model: voice,
        encoding: "mp3",
      }
    );

    const stream = await response.getStream();

    if (!stream) {
      throw new Error("No audio stream received from Deepgram");
    }

    const buffer = await getAudioBuffer(stream);

    return {
      success: true,
      buffer,
      text,
    };
  } catch (error) {
    console.error("Deepgram TTS Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      text,
    };
  }
};
