import { buildApp } from "./app.js";

await buildApp().listen({ host: "0.0.0.0", port: Number(process.env.PORT ?? 4002) });
