import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";

export interface AuthSummary {
  brand: string;
  identity: string;
  defaultAs: string;
  userName: string;
  note: string;
}

export async function authStatus(adapter: LarkCliAdapter, _options: GlobalOptions): Promise<RenderDocument> {
  const status = await adapter.authStatus();
  const auth = normalizeAuthStatus(status);
  return {
    sections: [
      {
        name: "auth",
        record: {
          brand: auth.brand,
          identity: auth.identity,
          default_as: auth.defaultAs,
          user: auth.userName,
          note: auth.note
        }
      }
    ],
    help: ["Run `lark-cli auth login --recommend` if user token is missing."]
  };
}

export function normalizeAuthStatus(status: Record<string, unknown>): AuthSummary {
  const identity = stringField(status, "identity");
  const identityStatus = recordField(recordField(status, "identities"), identity);

  return {
    brand: stringField(status, "brand"),
    identity,
    defaultAs: stringField(status, "defaultAs"),
    userName: stringField(status, "userName") || stringField(identityStatus, "userName"),
    note: stringField(status, "note")
  };
}

function recordField(record: Record<string, unknown> | undefined, key: string): Record<string, unknown> | undefined {
  if (!record || !key) return undefined;
  const value = record[key];
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : undefined;
}

function stringField(record: Record<string, unknown> | undefined, key: string): string {
  const value = record?.[key];
  return typeof value === "string" ? value : "";
}
