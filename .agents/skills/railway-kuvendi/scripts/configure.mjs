#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import process from "node:process";

const projectId = "4739a763-6d33-475d-877c-1b8535e2bcbe";
const environmentId = "aa1a25b6-d4b8-4896-84ed-d643ffee6fcf";
const endpoint = "https://backboard.railway.app/graphql/v2";
const apply = process.argv.includes("--apply");
const activateConfig = process.argv.includes("--activate-config");

if (
  process.argv.slice(2).some((argument) => !["--apply", "--activate-config"].includes(argument))
) {
  console.error("Usage: configure.mjs [--apply] [--activate-config]");
  process.exit(2);
}

if (activateConfig && !apply) {
  console.error("--activate-config requires --apply");
  process.exit(2);
}

const apps = {
  web: {
    id: "80908e70-6f04-4e6d-8cb4-8028f3740f1d",
    configFile: "/apps/web/railway.json",
    domain: "https://kuvend.org",
    sleepApplication: false,
    vCPUs: 1,
    memoryGB: 0.5,
  },
  "civic-api": {
    id: "bf1f4f79-b7f6-4565-9caf-eb4063d8cd8a",
    configFile: "/apps/civic-api/railway.json",
    domain: "https://api.kuvend.org",
    sleepApplication: false,
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  issuer: {
    id: "3e12935b-e5d3-4dfd-8205-7173fec44e9b",
    configFile: "/apps/issuer/railway.json",
    domain: "https://issuer.kuvend.org",
    sleepApplication: true,
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  assistant: {
    id: "21235006-1348-4d2c-a118-451057ece264",
    configFile: "/apps/assistant/railway.json",
    domain: "https://assistant.kuvend.org",
    sleepApplication: true,
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  notifications: {
    id: "fa306d00-8478-4c7e-a575-d59ee9fcf424",
    configFile: "/apps/notifications/railway.json",
    domain: "https://notifications.kuvend.org",
    sleepApplication: true,
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  admin: {
    id: "4815cd9b-0723-40b9-abd5-ee793345a805",
    configFile: "/apps/admin/railway.json",
    domain: "https://admin.kuvend.org",
    sleepApplication: true,
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
};

const databases = {
  Postgres: { id: "8354c788-3a56-4485-8aa7-ad52c6cbbcf5", vCPUs: 0.5, memoryGB: 0.25 },
  "Postgres-REmA": {
    id: "7fa5ec96-d615-4a2d-b6a6-afc8e9d46e22",
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  "Postgres-6m7Z": {
    id: "0454a4df-61b4-4321-bce1-e77889d6a6ad",
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
  "Postgres-htSR": {
    id: "8b82ccf7-90a7-4bfc-ba92-c96c65b12fb7",
    vCPUs: 0.5,
    memoryGB: 0.25,
  },
};

const config = JSON.parse(await readFile(`${homedir()}/.railway/config.json`, "utf8"));
const token = config.user?.token;
if (!token) throw new Error("Railway user token not found; run railway login first.");

async function graphQL(query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    const messages = body.errors?.map((error) => error.message).join("; ") ?? response.statusText;
    throw new Error(`Railway API failure: ${messages}`);
  }
  return body.data;
}

const auditQuery = `
  query Audit($projectId: String!) {
    project(id: $projectId) {
      name
      services {
        edges {
          node {
            id
            name
            serviceInstances {
              edges {
                node {
                  environmentId
                  rootDirectory
                  railwayConfigFile
                  watchPatterns
                  healthcheckPath
                  healthcheckTimeout
                  sleepApplication
                  drainingSeconds
                  restartPolicyType
                  restartPolicyMaxRetries
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function audit() {
  const data = await graphQL(auditQuery, { projectId });
  const rows = data.project.services.edges
    .map(({ node }) => ({
      id: node.id,
      name: node.name,
      ...node.serviceInstances.edges.find(
        ({ node: instance }) => instance.environmentId === environmentId,
      )?.node,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
  console.log(
    JSON.stringify(
      { project: data.project.name, environment: "production", services: rows },
      null,
      2,
    ),
  );
  return rows;
}

async function applyContract() {
  const updateMutation = `
    mutation Update($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `;
  const limitMutation = `
    mutation Limits($input: ServiceInstanceLimitsUpdateInput!) {
      serviceInstanceLimitsUpdate(input: $input)
    }
  `;

  for (const [name, service] of Object.entries(apps)) {
    const local = JSON.parse(
      await readFile(new URL(`../../../../apps/${name}/railway.json`, import.meta.url), "utf8"),
    );
    await graphQL(updateMutation, {
      serviceId: service.id,
      environmentId,
      input: {
        dockerfilePath: local.build.dockerfilePath,
        ...(activateConfig ? { railwayConfigFile: service.configFile } : {}),
        watchPatterns: local.build.watchPatterns,
        healthcheckPath: name === "web" && !activateConfig ? "/" : local.deploy.healthcheckPath,
        healthcheckTimeout: local.deploy.healthcheckTimeout,
        drainingSeconds: local.deploy.drainingSeconds,
        restartPolicyType: local.deploy.restartPolicyType,
        restartPolicyMaxRetries: local.deploy.restartPolicyMaxRetries,
        sleepApplication: service.sleepApplication,
      },
    });
    await graphQL(limitMutation, {
      input: {
        serviceId: service.id,
        environmentId,
        vCPUs: service.vCPUs,
        memoryGB: service.memoryGB,
      },
    });
    console.log(`Applied application contract: ${name}`);
  }

  for (const [name, service] of Object.entries(databases)) {
    await graphQL(limitMutation, {
      input: {
        serviceId: service.id,
        environmentId,
        vCPUs: service.vCPUs,
        memoryGB: service.memoryGB,
      },
    });
    console.log(`Applied database limits: ${name}`);
  }
}

async function checkDomains(rows) {
  for (const [name, service] of Object.entries(apps)) {
    const live = rows.find((row) => row.name === name);
    const healthUrl = new URL(live?.healthcheckPath ?? "/", service.domain);
    try {
      const response = await fetch(healthUrl, { signal: AbortSignal.timeout(15_000) });
      const message = `${name}: ${response.status} ${healthUrl}`;
      if (response.ok) console.log(message);
      else {
        console.error(message);
        process.exitCode = 1;
      }
    } catch (error) {
      console.error(`${name}: health request failed (${error.message})`);
      process.exitCode = 1;
    }
  }
}

if (apply) await applyContract();
const rows = await audit();
await checkDomains(rows);
