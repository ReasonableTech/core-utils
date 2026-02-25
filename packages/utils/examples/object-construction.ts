/**
 * Object Construction Patterns
 *
 * This example demonstrates clean object construction patterns that work with
 * TypeScript's exactOptionalPropertyTypes compiler option. These utilities
 * help build objects with conditional properties without assigning undefined.
 *
 * Run: npx tsx examples/object-construction.ts
 */

import {
  includeIf,
  includeIfDefined,
  omitUndefined,
  conditionalProps,
  pick,
  omit,
} from "@reasonabletech/utils/object";

// =============================================================================
// The Problem: exactOptionalPropertyTypes
// =============================================================================

console.log("=== The Problem with exactOptionalPropertyTypes ===\n");

// When exactOptionalPropertyTypes is enabled in tsconfig.json,
// you cannot assign undefined to optional properties:

interface UserProfile {
  name: string;
  email?: string; // Optional property
  bio?: string; // Optional property
}

// This would fail with exactOptionalPropertyTypes:
// const badProfile: UserProfile = {
//   name: "Alice",
//   email: undefined,  // Error! undefined not assignable to optional property
// };

// The solution is to omit the property entirely:
const goodProfile: UserProfile = {
  name: "Alice",
  // email is simply not included
};

console.log("Profile without optional props:", goodProfile);

// =============================================================================
// includeIf: Single Conditional Property
// =============================================================================

console.log("\n=== includeIf: Single Conditional Property ===\n");

// includeIf adds a property only if the value is defined
const maybeEmail: string | undefined = "alice@example.com";
const maybePhone: string | undefined = undefined;

const userWithConditionalProps = {
  name: "Alice",
  ...includeIf("email", maybeEmail), // Included
  ...includeIf("phone", maybePhone), // Not included (undefined)
};

console.log("User with includeIf:", userWithConditionalProps);
// Output: { name: "Alice", email: "alice@example.com" }

// Real-world: Building API response
interface ApiUserResponse {
  id: number;
  username: string;
  email?: string;
  avatar?: string;
  lastSeen?: string;
}

function buildUserResponse(
  user: { id: number; username: string },
  email: string | undefined,
  avatarUrl: string | undefined,
  lastSeenAt: Date | undefined
): ApiUserResponse {
  return {
    id: user.id,
    username: user.username,
    ...includeIf("email", email),
    ...includeIf("avatar", avatarUrl),
    ...includeIf("lastSeen", lastSeenAt?.toISOString()),
  };
}

const fullResponse = buildUserResponse(
  { id: 1, username: "alice" },
  "alice@example.com",
  "https://example.com/avatar.png",
  new Date()
);

const minimalResponse = buildUserResponse(
  { id: 2, username: "bob" },
  undefined,
  undefined,
  undefined
);

console.log("Full API response:", fullResponse);
console.log("Minimal API response:", minimalResponse);

// =============================================================================
// includeIfDefined: Multiple Conditional Properties
// =============================================================================

console.log("\n=== includeIfDefined: Multiple Conditional Properties ===\n");

// When you have many optional properties, use includeIfDefined
interface ServerConfig {
  host: string;
  port: number;
  ssl?: { cert: string; key: string };
  auth?: { provider: string; secret: string };
  timeout?: number;
  maxConnections?: number;
}

function buildServerConfig(
  host: string,
  port: number,
  options: {
    enableSsl?: boolean;
    certPath?: string;
    keyPath?: string;
    authProvider?: string;
    authSecret?: string;
    timeout?: number;
    maxConnections?: number;
  }
): ServerConfig {
  return {
    host,
    port,
    ...includeIfDefined({
      ssl:
        options.enableSsl && options.certPath && options.keyPath
          ? { cert: options.certPath, key: options.keyPath }
          : undefined,
      auth:
        options.authProvider && options.authSecret
          ? { provider: options.authProvider, secret: options.authSecret }
          : undefined,
      timeout: options.timeout,
      maxConnections: options.maxConnections,
    }),
  };
}

const fullConfig = buildServerConfig("localhost", 3000, {
  enableSsl: true,
  certPath: "/path/to/cert.pem",
  keyPath: "/path/to/key.pem",
  authProvider: "oauth",
  authSecret: "secret123",
  timeout: 30000,
  maxConnections: 100,
});

const minimalConfig = buildServerConfig("localhost", 3000, {});

console.log("Full server config:", fullConfig);
console.log("Minimal server config:", minimalConfig);

// =============================================================================
// omitUndefined: Clean Up Existing Objects
// =============================================================================

console.log("\n=== omitUndefined: Clean Up Objects ===\n");

// Sometimes you receive data with undefined values that need cleaning
const rawFormData = {
  name: "Alice",
  email: "alice@example.com",
  phone: undefined,
  company: undefined,
  website: "https://alice.dev",
  bio: undefined,
};

const cleanFormData = omitUndefined(rawFormData);

console.log("Raw form data:", rawFormData);
console.log("Clean form data:", cleanFormData);
// Output: { name: "Alice", email: "alice@example.com", website: "https://alice.dev" }

// Note: omitUndefined preserves other falsy values
const dataWithFalsyValues = {
  name: "Test",
  count: 0, // Preserved (falsy but defined)
  active: false, // Preserved (falsy but defined)
  label: "", // Preserved (falsy but defined)
  data: null, // Preserved (null !== undefined)
  missing: undefined, // Removed
};

const cleanedFalsy = omitUndefined(dataWithFalsyValues);
console.log("Cleaned with falsy values:", cleanedFalsy);

// =============================================================================
// conditionalProps: Boolean-Based Properties
// =============================================================================

console.log("\n=== conditionalProps: Boolean-Based Properties ===\n");

// Add properties based on boolean conditions
interface AppConfig {
  baseUrl: string;
  logging?: { level: string };
  metrics?: { endpoint: string };
  debug?: { verbose: boolean };
}

function buildAppConfig(
  enableLogging: boolean,
  enableMetrics: boolean,
  isDebugMode: boolean
): AppConfig {
  return {
    baseUrl: "https://api.example.com",
    ...conditionalProps({
      [String(enableLogging)]: { logging: { level: "info" } },
      [String(enableMetrics)]: { metrics: { endpoint: "/metrics" } },
      [String(isDebugMode)]: { debug: { verbose: true } },
    }),
  };
}

const prodConfig = buildAppConfig(true, true, false);
const devConfig = buildAppConfig(true, false, true);
const minConfig = buildAppConfig(false, false, false);

console.log("Production config:", prodConfig);
console.log("Development config:", devConfig);
console.log("Minimal config:", minConfig);

// =============================================================================
// pick: Select Specific Properties
// =============================================================================

console.log("\n=== pick: Select Specific Properties ===\n");

interface FullUser {
  id: number;
  email: string;
  username: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  settings: object;
}

const fullUser: FullUser = {
  id: 1,
  email: "alice@example.com",
  username: "alice",
  password: "hashed_password_here",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-06-15"),
  settings: { theme: "dark" },
};

// Create a public profile with only safe fields
const publicProfile = pick(fullUser, ["id", "username", "createdAt"]);
console.log("Public profile:", publicProfile);

// Create a minimal user reference
const userRef = pick(fullUser, ["id", "email"]);
console.log("User reference:", userRef);

// =============================================================================
// omit: Remove Specific Properties
// =============================================================================

console.log("\n=== omit: Remove Specific Properties ===\n");

// Remove sensitive data before sending to client
const safeUser = omit(fullUser, ["password", "settings"]);
console.log("Safe user (password/settings removed):", safeUser);

// Remove internal fields for API response
interface InternalDocument {
  _id: string;
  _version: number;
  _internal: object;
  title: string;
  content: string;
  author: string;
}

const internalDoc: InternalDocument = {
  _id: "mongo_id_123",
  _version: 5,
  _internal: { audit: [] },
  title: "My Document",
  content: "Document content here",
  author: "Alice",
};

const publicDoc = omit(internalDoc, ["_id", "_version", "_internal"]);
console.log("Public document:", publicDoc);

// =============================================================================
// Real-World Example: Form Data Processing
// =============================================================================

console.log("\n=== Real-World Example: Form Data Processing ===\n");

interface FormInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  message: string;
}

interface ProcessedFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  message: string;
  submittedAt: string;
}

function processContactForm(rawInput: {
  name: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  message: string;
}): ProcessedFormData {
  // Clean and validate inputs
  const cleanPhone = rawInput.phone.trim() || undefined;
  const cleanCompany = rawInput.company.trim() || undefined;
  const cleanWebsite =
    rawInput.website.trim() && rawInput.website.startsWith("http")
      ? rawInput.website.trim()
      : undefined;

  return {
    name: rawInput.name.trim(),
    email: rawInput.email.trim().toLowerCase(),
    message: rawInput.message.trim(),
    submittedAt: new Date().toISOString(),
    ...includeIfDefined({
      phone: cleanPhone,
      company: cleanCompany,
      website: cleanWebsite,
    }),
  };
}

const rawFormInput = {
  name: "  Alice Smith  ",
  email: "Alice@Example.COM",
  phone: "  ",
  company: "Acme Corp",
  website: "invalid-url",
  message: "Hello, I have a question.",
};

const processedForm = processContactForm(rawFormInput);
console.log("Processed form data:", processedForm);

// =============================================================================
// Real-World Example: API Request Builder
// =============================================================================

console.log("\n=== Real-World Example: API Request Builder ===\n");

interface ApiRequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  timeout?: number;
  retries?: number;
}

function buildApiRequest(
  method: string,
  url: string,
  options: {
    body?: object;
    authToken?: string;
    timeout?: number;
    retries?: number;
    correlationId?: string;
  } = {}
): ApiRequestConfig {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...includeIf("Authorization", options.authToken ? `Bearer ${options.authToken}` : undefined),
    ...includeIf("X-Correlation-Id", options.correlationId),
  };

  return {
    method,
    url,
    headers,
    ...includeIfDefined({
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: options.timeout,
      retries: options.retries,
    }),
  };
}

const getRequest = buildApiRequest("GET", "/api/users", {
  authToken: "token123",
  timeout: 5000,
});

const postRequest = buildApiRequest("POST", "/api/users", {
  authToken: "token123",
  body: { name: "Alice", email: "alice@example.com" },
  retries: 3,
  correlationId: "req-123",
});

console.log("GET request:", getRequest);
console.log("POST request:", postRequest);

// =============================================================================
// Combining Patterns
// =============================================================================

console.log("\n=== Combining Patterns ===\n");

interface OrderSummary {
  orderId: string;
  items: string[];
  subtotal: number;
  tax: number;
  shipping?: number;
  discount?: number;
  total: number;
  notes?: string;
}

function createOrderSummary(
  orderId: string,
  items: string[],
  subtotal: number,
  taxRate: number,
  options: {
    shippingCost?: number;
    discountCode?: string;
    discountAmount?: number;
    customerNotes?: string;
    isExpressShipping?: boolean;
  } = {}
): OrderSummary {
  const tax = subtotal * taxRate;
  const discount = options.discountAmount || 0;
  const shipping = options.shippingCost || 0;
  const total = subtotal + tax + shipping - discount;

  return {
    orderId,
    items,
    subtotal,
    tax,
    total,
    ...includeIfDefined({
      shipping: options.shippingCost,
      discount: options.discountAmount,
      notes: options.customerNotes?.trim() || undefined,
    }),
  };
}

const simpleOrder = createOrderSummary("ORD-001", ["Widget", "Gadget"], 99.99, 0.08);

const complexOrder = createOrderSummary("ORD-002", ["Premium Widget"], 199.99, 0.08, {
  shippingCost: 9.99,
  discountCode: "SAVE10",
  discountAmount: 10.0,
  customerNotes: "Please gift wrap",
  isExpressShipping: true,
});

console.log("Simple order:", simpleOrder);
console.log("Complex order:", complexOrder);

console.log("\n=== Examples Complete ===");
