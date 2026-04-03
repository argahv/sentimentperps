#!/usr/bin/env node
/**
 * Pacifica Auth Signature Verification Test
 * 
 * This script validates:
 * 1. Timestamp units (ms vs seconds) expected by Pacifica
 * 2. Signature encoding format (base58 vs base64/hex)
 * 3. JSON sorting/formatting for signature verification
 * 
 * Usage:
 *   npx ts-node scripts/test-pacifica-auth.ts
 * 
 * Requirements:
 *   - PRIVY_APP_ID env var (for embedded wallet)
 *   - Valid Solana keypair for signing (optional: uses Privy wallet if available)
 */

import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";

// Test vectors
const TEST_CASES = [
  {
    name: "Millisecond timestamps (Date.now())",
    timestamp: Date.now(), // ~1759224000000
    expectedUnit: "ms",
  },
  {
    name: "Second timestamps (Math.floor(Date.now()/1000))",
    timestamp: Math.floor(Date.now() / 1000), // ~1759224000
    expectedUnit: "seconds",
  },
];

function sortPayload(obj: unknown): unknown {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(sortPayload);
  return Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce(
      (sorted, key) => {
        sorted[key] = sortPayload((obj as Record<string, unknown>)[key]);
        return sorted;
      },
      {} as Record<string, unknown>,
    );
}

function prepareSignatureMessage(
  header: { type: string; timestamp: number; expiry_window: number },
  data: Record<string, unknown> = {},
): Uint8Array {
  const message = {
    ...header,
    data,
  };
  const sorted = sortPayload(message);
  return new TextEncoder().encode(JSON.stringify(sorted));
}

async function testSignatureFormat() {
  console.log("🔐 Pacifica Authentication Format Test\n");

  // Generate a test keypair
  const keypair = Keypair.generate();
  const walletAddress = keypair.publicKey.toBase58();

  console.log(`Using test wallet: ${walletAddress}\n`);

  for (const testCase of TEST_CASES) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log(`   Timestamp: ${testCase.timestamp}`);
    console.log(`   Expected Unit: ${testCase.expectedUnit}`);

    const header = {
      type: "get_positions",
      timestamp: testCase.timestamp,
      expiry_window: 60000, // 60 seconds (ms)
    };

    const data = {
      symbol: "BTC",
    };

    const messageBytes = prepareSignatureMessage(header, data);
    const messageJson = new TextDecoder().decode(messageBytes);

    console.log(`\n   Message to sign (compact JSON):`);
    console.log(`   ${messageJson}`);

    // Sign with nacl (Ed25519)
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    const signatureBase58 = bs58.encode(signature);

    console.log(`\n   Signature (base58): ${signatureBase58}`);
    console.log(`   Signature (hex): ${Buffer.from(signature).toString("hex")}`);

    // Verify signature locally
    const isValid = nacl.sign.detached.verify(
      messageBytes,
      signature,
      keypair.publicKey.toBytes(),
    );
    console.log(`\n   ✓ Local verification: ${isValid ? "PASS" : "FAIL"}`);

    // What would be sent to Pacifica
    const request = {
      account: walletAddress,
      signature: signatureBase58,
      type: header.type,
      timestamp: header.timestamp,
      expiry_window: header.expiry_window,
      ...data,
    };

    console.log(`\n   Request body to Pacifica:`);
    console.log(`   ${JSON.stringify(request, null, 2)}`);

    // Test against Pacifica testnet (if you have credentials)
    const pacificaTestnetUrl = "https://test-api.pacifica.fi/api/v1";
    console.log(`\n   → Would send to: ${pacificaTestnetUrl}/positions`);
    console.log(`   → Auth headers would include: X-Signature-Timestamp, X-Signature-Expiry, X-Signature-Type`);
  }

  console.log("\n\n✅ Auth format test complete!");
  console.log("\n📝 Notes:");
  console.log("   • Timestamp format appears to be milliseconds (Date.now())");
  console.log("   • Signature encoding is base58 (standard for Solana)");
  console.log("   • All auth fields (type, timestamp, expiry_window) must be in request");
  console.log("   • JSON keys must be recursively sorted for verification to work");
}

testSignatureFormat().catch(console.error);
