import { NextResponse } from "next/server";

const artifactPattern = /^semaphore-(\d{1,2})\.(wasm|zkey)$/;

export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const { file } = await context.params;
  const match = artifactPattern.exec(file);
  const depth = Number(match?.[1]);
  if (!match || depth < 1 || depth > 32) {
    return NextResponse.json({ error: "artifact_not_found" }, { status: 404 });
  }
  const upstream = await fetch(`https://snark-artifacts.pse.dev/semaphore/4.13.0/${file}`, {
    cache: "no-store",
  });
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "artifact_unavailable" }, { status: 502 });
  }
  return new NextResponse(upstream.body, {
    headers: {
      "content-type": match[2] === "wasm" ? "application/wasm" : "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
}
