import type { GlobalOptions, RenderDocument } from "../types.js";
import type { LarkCliAdapter } from "../lark/adapter.js";

export async function authStatus(adapter: LarkCliAdapter, _options: GlobalOptions): Promise<RenderDocument> {
  const status = await adapter.authStatus();
  return {
    sections: [
      {
        name: "auth",
        record: {
          brand: status.brand ?? "",
          identity: status.identity ?? "",
          default_as: status.defaultAs ?? "",
          user: status.userName ?? "",
          note: status.note ?? ""
        }
      }
    ],
    help: ["Run `lark-cli auth login --recommend` if user token is missing."]
  };
}
