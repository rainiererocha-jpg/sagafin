'use strict';
// Minimal .env loader for one-off scripts (no dependency on `dotenv`).
// Reads KEY=VALUE lines from the project's .env (gitignored) and exposes
// them via process.env, without overwriting anything already set.
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

if (fs.existsSync(ENV_PATH)) {
  const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function require_env(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — set it in sagafin/.env (see .env.example)`);
  }
  return value;
}

module.exports = { require_env };
