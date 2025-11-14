#!/usr/bin/env node

const https = require("https");
const http = require("http");

const COLORS = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const log = (emoji, message, color = COLORS.reset) => {
  console.log(`${emoji} ${color}${message}${COLORS.reset}`);
};

let successCount = 0;
let failureCount = 0;

function makeRequest(url, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    const options = {
      method,
      timeout: 10000,
    };

    const req = client.request(url, options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          url,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testEndpoint(
  url,
  description,
  method = "GET",
  expectedStatus = 200,
) {
  try {
    log("🔍", `Testing ${description}...`);
    const response = await makeRequest(url, method);

    if (
      response.status === expectedStatus ||
      (expectedStatus === 200 &&
        response.status >= 200 &&
        response.status < 300)
    ) {
      log("✅", `${description} - Status: ${response.status}`);
      successCount++;
      return true;
    } else {
      log(
        "❌",
        `${description} - Expected status ${expectedStatus}, got ${response.status}`,
      );
      failureCount++;
      return false;
    }
  } catch (error) {
    log("❌", `${description} - Error: ${error.message}`);
    failureCount++;
    return false;
  }
}

async function runVerification() {
  const baseUrl = process.argv[2] || "http://localhost:5173";
  const apiBaseUrl = baseUrl;

  try {
    log("🚀", `Starting deployment verification for: ${baseUrl}`, COLORS.blue);
    log("", "");

    log("📝", "Testing Homepage...", COLORS.blue);
    await testEndpoint(`${baseUrl}/`, "GET /", "GET", 200);

    log("", "");
    log("📝", "Testing API Endpoints...", COLORS.blue);

    // Test ping endpoint
    await testEndpoint(`${apiBaseUrl}/api/ping`, "GET /api/ping", "GET");

    // Test health check endpoints (may return 404 if not implemented, that's ok)
    await testEndpoint(
      `${apiBaseUrl}/api/check-ip-assets`,
      "POST /api/check-ip-assets",
      "POST",
      400,
    );

    log("", "");
    log("📊", `Verification Summary:`, COLORS.blue);
    log("✅", `Successful tests: ${successCount}`, COLORS.green);

    if (failureCount > 0) {
      log("❌", `Failed tests: ${failureCount}`, COLORS.red);
      log("", "");
      log(
        "⚠️",
        `Some endpoints are not responding as expected. This may be normal if the server is not running or these endpoints are not implemented.`,
      );
      process.exit(1);
    } else {
      log("", "");
      log("🎉", "All deployment verification tests passed!", COLORS.green);
      process.exit(0);
    }
  } catch (error) {
    log("❌", `Fatal error during verification: ${error.message}`, COLORS.red);
    process.exit(1);
  }
}

// Display usage if no URL provided
if (!process.argv[2]) {
  log(
    "ℹ���",
    "Usage: node scripts/verify-deployment.js <base-url>",
    COLORS.blue,
  );
  log(
    "ℹ️",
    "Example: node scripts/verify-deployment.js http://localhost:5173",
    COLORS.blue,
  );
  log("ℹ️", "Running with default: http://localhost:5173", COLORS.blue);
  log("", "");
}

runVerification();
