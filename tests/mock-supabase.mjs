// A separate test process, never imported by the application or deployed as a route.
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

const names = {
  "perera-family": "Mr. & Mrs. Perera",
  "silva-family": "Mr. Silva & Family",
  "fernando-invitation": "Mrs. Fernando",
  "jayasinghe-family": "Mr. & Mrs. Jayasinghe & Family",
  "doctor-perera": "Dr. Perera & Family",
  "long-family-name": "Mr. & Mrs. Wickramasinghe-Jayawardene & Their Beloved Family",
};

const password = "test-admin-password";
const users = ["admin", "guest"].map((name, index) => ({
  id: `00000000-0000-4000-8000-00000000000${index + 1}`,
  aud: "authenticated",
  role: "authenticated",
  email: `${name}@example.test`,
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
}));
const sessions = new Map();
const invitations = new Map(Object.entries(names).map(([token, display_name]) => {
  const id = randomUUID();
  return [id, { id, guest_name: display_name, title: "", display_name, token, is_active: true, created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z" }];
}));
const issuedTokens = new Set(Object.keys(names));

function createSession(user) {
  const expires_at = Math.floor(Date.now() / 1000) + 3600;
  // Supabase SSR decodes the JWT expiry before forwarding it to getUser.
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const access_token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, aud: "authenticated", role: "authenticated", exp: expires_at, session_id: randomUUID() })}.test-signature`;
  const session = { access_token, refresh_token: randomUUID(), token_type: "bearer", expires_in: 3600, expires_at, user };
  sessions.set(access_token, session);
  return session;
}

createServer(async (request, response) => {
  const url = new URL(request.url, "http://127.0.0.1:54329");
  response.setHeader("Content-Type", "application/json");
  response.setHeader("Cache-Control", "no-store");
  const send = (status, data) => {
    response.statusCode = status;
    response.end(data === undefined ? undefined : JSON.stringify(data));
  };
  const session = request.headers.apikey === "test-publishable-key"
    ? sessions.get(request.headers.authorization?.replace(/^Bearer /, ""))
    : undefined;
  const body = async () => {
    let data = "";
    for await (const chunk of request) data += chunk;
    return JSON.parse(data || "{}");
  };
  const result = (rows) => send(200, request.headers.accept?.includes("vnd.pgrst.object") ? rows[0] ?? null : rows);
  if (url.pathname === "/health") return response.end('{"ok":true}');
  try {
    if (url.pathname === "/auth/v1/token" && request.method === "POST" && request.headers.apikey === "test-publishable-key") {
      const input = await body();
      if (url.searchParams.get("grant_type") === "password") {
        const user = users.find((user) => user.email === input.email);
        return user && input.password === password
          ? send(200, createSession(user))
          : send(400, { code: "invalid_credentials", message: "Invalid login credentials" });
      }
      if (url.searchParams.get("grant_type") === "refresh_token") {
        const previous = [...sessions.values()].find((value) => value.refresh_token === input.refresh_token);
        if (!previous) return send(400, { code: "refresh_token_not_found", message: "Invalid refresh token" });
        sessions.delete(previous.access_token);
        return send(200, createSession(previous.user));
      }
    }
    if (url.pathname === "/auth/v1/user" && request.method === "GET" && session)
      return send(200, session.user);
    if (url.pathname === "/auth/v1/logout" && request.method === "POST" && session) {
      sessions.delete(session.access_token);
      return send(204);
    }
    if (url.pathname === "/rest/v1/admin_users" && request.method === "GET" && session) {
      return result(session.user.id === users[0].id && url.searchParams.get("user_id") === `eq.${session.user.id}`
        ? [{ user_id: session.user.id }] : []);
    }
    if (url.pathname === "/rest/v1/invitations") {
      const serviceLookup = request.headers.apikey === "test-server-key";
      if (serviceLookup) {
        if (request.method !== "GET" || url.searchParams.get("select") !== "display_name" || url.searchParams.get("is_active") !== "eq.true")
          return send(403, { message: "Uncontrolled test lookup" });
        const token = (url.searchParams.get("token") ?? "").replace(/^eq\./, "");
        if (token === "database-failure") return send(503, { message: "Internal test failure, do not expose" });
        const row = [...invitations.values()].find((row) => row.token === token && row.is_active);
        return result(row ? [{ display_name: row.display_name }] : []);
      }
      if (!session || session.user.id !== users[0].id) return send(401, { message: "Not authenticated" });
      if (request.method === "POST" || request.method === "PATCH") {
        const input = await body();
        const id = url.searchParams.get("id")?.replace(/^eq\./, "");
        const previous = invitations.get(id);
        if (request.method === "PATCH" && !previous) return result([]);
        if (input.token && input.token !== previous?.token && issuedTokens.has(input.token))
          return send(409, { code: "23505", message: "duplicate key value violates unique constraint invitations_token_key" });
        const now = new Date().toISOString();
        const row = { id: randomUUID(), is_active: true, created_at: now, ...previous, ...input, updated_at: now };
        invitations.set(row.id, row);
        issuedTokens.add(row.token);
        return request.headers.prefer?.includes("return=representation") ? result([{ id: row.id }]) : send(201);
      }
      if (request.method === "GET" || request.method === "HEAD") {
        let rows = [...invitations.values()];
        if (url.searchParams.has("is_active")) rows = rows.filter((row) => `eq.${row.is_active}` === url.searchParams.get("is_active"));
        const search = url.searchParams.get("display_name");
        if (search?.startsWith("ilike.%") && search.endsWith("%")) {
          const literal = search.slice(7, -1).replace(/\\([\\%_])/g, "$1").toLowerCase();
          rows = rows.filter((row) => row.display_name.toLowerCase().includes(literal));
        }
        rows.sort((a, b) => b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
        const count = rows.length;
        const offset = Number(url.searchParams.get("offset") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? count);
        rows = rows.slice(offset, offset + limit);
        response.setHeader("Content-Range", rows.length ? `${offset}-${offset + rows.length - 1}/${count}` : `*/${count}`);
        if (request.method === "HEAD") return send(200);
        const columns = (url.searchParams.get("select") ?? "*").split(",");
        return result(rows.map((row) => columns.includes("*") ? row : Object.fromEntries(columns.map((column) => [column, row[column]]))));
      }
    }
    return send(401, { message: "Not authenticated" });
  } catch {
    return send(400, { message: "Invalid mock request" });
  }
}).listen(54329, "127.0.0.1");
