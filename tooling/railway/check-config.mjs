import { readFile } from "node:fs/promises";
import process from "node:process";

const sharedPaths = [
  "/package.json",
  "/pnpm-lock.yaml",
  "/pnpm-workspace.yaml",
  "/tsconfig.base.json",
];

const services = {
  web: {
    healthcheckPath: "/api/health",
    paths: ["/apps/web/**", "/packages/contracts/**", "/packages/ui/**"],
  },
  "civic-api": {
    healthcheckPath: "/health",
    paths: [
      "/apps/civic-api/**",
      "/packages/contracts/**",
      "/packages/credential/**",
      "/packages/privacy-testkit/**",
    ],
  },
  issuer: {
    healthcheckPath: "/health",
    paths: ["/apps/issuer/**", "/packages/contracts/**", "/packages/credential/**"],
  },
  assistant: {
    healthcheckPath: "/health",
    paths: ["/apps/assistant/**", "/packages/contracts/**", "/packages/privacy-testkit/**"],
  },
  notifications: { healthcheckPath: "/health", paths: ["/apps/notifications/**"] },
  admin: { healthcheckPath: "/health", paths: ["/apps/admin/**", "/packages/ui/**"] },
};

const failures = [];

for (const [service, contract] of Object.entries(services)) {
  const path = new URL(`../../apps/${service}/railway.json`, import.meta.url);
  const config = JSON.parse(await readFile(path, "utf8"));
  const expectedPaths = [...contract.paths, ...sharedPaths];

  if (config.build?.builder !== "DOCKERFILE")
    failures.push(`${service}: builder must be DOCKERFILE`);
  if (config.build?.dockerfilePath !== `/apps/${service}/Dockerfile`)
    failures.push(`${service}: unexpected Dockerfile path`);
  if (JSON.stringify(config.build?.watchPatterns) !== JSON.stringify(expectedPaths))
    failures.push(`${service}: watch paths differ from the deployment contract`);
  if (config.deploy?.healthcheckPath !== contract.healthcheckPath)
    failures.push(`${service}: unexpected healthcheck path`);
  if (config.deploy?.healthcheckTimeout !== 60)
    failures.push(`${service}: healthcheck timeout must be 60 seconds`);
  if (config.deploy?.drainingSeconds !== 10)
    failures.push(`${service}: draining time must be 10 seconds`);
  if (config.deploy?.restartPolicyType !== "ON_FAILURE")
    failures.push(`${service}: restart policy must be ON_FAILURE`);
  if (config.deploy?.restartPolicyMaxRetries !== 10)
    failures.push(`${service}: restart retries must be 10`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Railway config contract valid for ${Object.keys(services).length} services.`);
