/**
 * Demonstration of the hooks system in @atomic-ehr/core
 * Shows how to use the hooks system for FHIR request processing
 */

import {
  type AppContext,
  ContextFactory,
  defineHook,
  generateRequestId,
  HooksManager,
  HookUtils,
  type RequestContext,
} from "../src/index.js";

// Mock services for demo
const mockLogger = {
  debug: (msg: string, data?: any) => console.log(`[DEBUG] ${msg}`, data || ""),
  info: (msg: string, data?: any) => console.log(`[INFO] ${msg}`, data || ""),
  warn: (msg: string, data?: any) => console.log(`[WARN] ${msg}`, data || ""),
  error: (msg: string, data?: any) => console.log(`[ERROR] ${msg}`, data || ""),
};

const mockClock = {
  now: () => Date.now(),
  toISOString: (timestamp?: number) =>
    new Date(timestamp || Date.now()).toISOString(),
};

const mockConfig = {
  get: (key: string) => undefined,
  set: (key: string, value: any) => {},
  has: (key: string) => false,
};

const mockEvents = {
  emit: () => true,
  on: function () {
    return this;
  },
  off: function () {
    return this;
  },
  once: function () {
    return this;
  },
};

async function demonstrateHooksSystem() {
  console.log("🎪 Demonstrating @atomic-ehr/core Hooks System\n");

  // Create hooks manager
  const hooksManager = new HooksManager();

  // Register authentication hook
  const authHook = defineHook({
    name: "jwt-authentication",
    phase: "preRequest",
    priority: 200, // High priority - runs early
    handler: async (context: RequestContext) => {
      console.log("🔐 Authenticating request...");

      const authHeader = context.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new Error("Authentication required");
      }

      // Mock JWT validation
      const token = authHeader.substring(7);
      if (token === "valid-token") {
        (context as any).user = {
          id: "user123",
          role: "practitioner",
          permissions: ["read", "write"],
        };
        console.log("✅ Authentication successful");
      } else {
        throw new Error("Invalid token");
      }
    },
  });

  // Register Patient-specific validation hook
  const patientValidationHook = HookUtils.forResources("Patient", {
    name: "patient-business-validation",
    phase: "preHandler",
    priority: 100,
    deps: ["jwt-authentication"], // Depends on auth
    handler: async (context: RequestContext) => {
      console.log("🏥 Validating Patient resource...");

      if (context.operation === "create" && context.body) {
        const patient = context.body as any;

        // Business rule: All patients must have a family name
        if (!patient.name?.[0]?.family) {
          throw new Error("Patient must have a family name");
        }

        // Business rule: Adult patients need contact info
        if (patient.birthDate) {
          const birthDate = new Date(patient.birthDate);
          const age = Math.floor(
            (Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          );

          if (age >= 18 && !patient.telecom?.length) {
            throw new Error("Adult patients must have contact information");
          }
        }

        console.log("✅ Patient validation passed");
      }
    },
  });

  // Register audit logging hook
  const auditHook = defineHook({
    name: "audit-logger",
    phase: "onResponse",
    priority: 50,
    resources: "*", // All resources
    handler: async (context: any) => {
      console.log("📝 Logging audit event...");

      if (["create", "update", "delete"].includes(context.operation)) {
        const auditEvent = {
          timestamp: new Date().toISOString(),
          action: context.operation,
          resourceType: context.resourceType,
          resourceId: context.params?.id || context.responseBody?.id,
          userId: context.user?.id || "anonymous",
          success: context.statusCode < 400,
        };

        console.log("📋 Audit Event:", JSON.stringify(auditEvent, null, 2));
      }
    },
  });

  // Register timing hook using utility
  const timingHook = HookUtils.withTiming({
    name: "performance-monitor",
    phase: "onResponse",
    priority: 90,
    handler: async (context: any) => {
      const duration = Date.now() - context.startTime;
      if (duration > 100) {
        // Slow request threshold
        console.log(`⚠️  Slow request detected: ${duration}ms`);
      }
    },
  });

  // Register all hooks
  console.log("🔗 Registering hooks...");
  hooksManager.register(authHook);
  hooksManager.register(patientValidationHook);
  hooksManager.register(auditHook);
  hooksManager.register(timingHook);

  console.log(`✅ Registered ${hooksManager.getAllHooks().length} hooks\n`);

  // Demonstrate successful Patient creation flow
  console.log("📊 Scenario 1: Valid Patient Creation");
  console.log("=====================================");

  try {
    // Create request context
    const baseContext = ContextFactory.createBaseContext({
      requestId: generateRequestId(),
      logger: mockLogger,
      clock: mockClock,
      config: mockConfig,
      events: mockEvents,
    });

    const appContext = ContextFactory.createAppContext(baseContext);

    const requestContext = ContextFactory.createRequestContext(appContext, {
      method: "POST",
      url: "/Patient",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/fhir+json",
      },
      body: {
        resourceType: "Patient",
        name: [{ family: "Doe", given: ["John"] }],
        gender: "male",
        birthDate: "1990-01-01",
        telecom: [{ system: "email", value: "john@example.com" }],
      },
      resourceType: "Patient",
      operation: "create",
    });

    // Execute hook phases
    await hooksManager.executePhase("preRequest", requestContext);
    await hooksManager.executePhase("preHandler", requestContext);

    // Simulate successful creation
    const responseContext = ContextFactory.createResponseContext(
      requestContext,
      {
        statusCode: 201,
        responseHeaders: { location: "/Patient/123" },
        responseBody: { ...(requestContext.body as any), id: "123" },
      },
    );

    await hooksManager.executePhase("onResponse", responseContext);

    console.log("✅ Patient creation successful!\n");
  } catch (error) {
    console.log("❌ Error:", (error as Error).message);
  }

  // Demonstrate validation failure
  console.log("📊 Scenario 2: Invalid Patient (Missing Contact Info)");
  console.log("====================================================");

  try {
    const baseContext2 = ContextFactory.createBaseContext({
      requestId: generateRequestId(),
      logger: mockLogger,
      clock: mockClock,
      config: mockConfig,
      events: mockEvents,
    });

    const appContext2 = ContextFactory.createAppContext(baseContext2);

    const requestContext2 = ContextFactory.createRequestContext(appContext2, {
      method: "POST",
      url: "/Patient",
      headers: {
        authorization: "Bearer valid-token",
        "content-type": "application/fhir+json",
      },
      body: {
        resourceType: "Patient",
        name: [{ family: "Smith", given: ["Jane"] }],
        gender: "female",
        birthDate: "1985-05-15",
        // Missing telecom for adult patient
      },
      resourceType: "Patient",
      operation: "create",
    });

    await hooksManager.executePhase("preRequest", requestContext2);
    await hooksManager.executePhase("preHandler", requestContext2);

    console.log("✅ This should not be reached");
  } catch (error) {
    console.log("❌ Validation failed as expected:", (error as Error).message);
  }

  console.log("\n🎉 Hooks system demonstration complete!");
  console.log("\nKey Features Demonstrated:");
  console.log("• Priority-based execution order");
  console.log("• Dependency resolution between hooks");
  console.log("• Resource-specific filtering");
  console.log("• Request lifecycle management");
  console.log("• Error handling and propagation");
  console.log("• Control flow and context augmentation");
  console.log("• Utility functions for common patterns");
}

// Run the demonstration
demonstrateHooksSystem().catch(console.error);
