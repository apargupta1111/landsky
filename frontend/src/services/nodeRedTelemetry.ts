/**
 * @deprecated This file is kept for backward compatibility only.
 * All logic has moved to backendTelemetry.ts which talks directly to
 * the custom Node.js backend instead of Node-RED.
 */
export * from './backendTelemetry';
export { fetchTelemetry as fetchNodeRedTelemetry } from './backendTelemetry';
