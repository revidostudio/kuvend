import { headers } from "next/headers";
import { countryHint } from "../../../features/kuvend/country-hint";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestHeaders = await headers();
  const country = countryHint(requestHeaders.get("cf-ipcountry"));

  return Response.json(
    { country },
    {
      headers: {
        "cache-control": "private, no-store, max-age=0",
        pragma: "no-cache",
        vary: "CF-IPCountry",
      },
    },
  );
}
