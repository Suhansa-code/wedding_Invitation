import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import {
  createInvitationSchema,
  invitationInputSchema,
  normalizeCustomToken,
  titlePresets,
  tokenSchema,
} from "../src/lib/validation";

const mocks = vi.hoisted(() => ({
  config: vi.fn(),
  authenticatedClient: vi.fn(),
  secretClient: vi.fn(),
  noStore: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn((url: string): never => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("node:crypto", async (importOriginal) => {
  const crypto = await importOriginal<typeof import("node:crypto")>();
  return { ...crypto, randomBytes: vi.fn(crypto.randomBytes) };
});
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("next/cache", () => ({
  unstable_noStore: mocks.noStore,
  revalidatePath: mocks.revalidatePath,
}));
vi.mock("../src/lib/supabase/env", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/lib/supabase/env")>(),
  supabaseConfig: mocks.config,
}));
vi.mock("../src/lib/supabase/server", () => ({
  createAuthenticatedClient: mocks.authenticatedClient,
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.secretClient }));
vi.mock("@/lib/auth", () => import("../src/lib/auth"));
vi.mock("@/lib/validation", () => import("../src/lib/validation"));
vi.mock("@/lib/tokens", () => import("../src/lib/tokens"));
vi.mock("@/lib/site", () => import("../src/lib/site"));
vi.mock("@/lib/supabase/env", async () => ({
  ...await import("../src/lib/supabase/env"),
  supabaseConfig: mocks.config,
}));
vi.mock("@/lib/supabase/server", () => ({
  createAuthenticatedClient: mocks.authenticatedClient,
}));

import { requireAdmin } from "../src/lib/auth";
import { resolveInvitation } from "../src/lib/invitations";
import { generateInvitationToken } from "../src/lib/tokens";
import {
  changeInvitationAction,
  createInvitationAction,
  loginAction,
  logoutAction,
  updateInvitationAction,
} from "../src/app/admin/actions";

function query() {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
  };
}

const membership = query();
const lookup = query();
const client = {
  auth: {
    getUser: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn().mockReturnValue(membership),
};
const guest = {
  guest_name: "Test Guest",
  title: "",
  display_name: "Test Guest",
};
const userId = "11111111-1111-4111-8111-111111111111";
const invitationId = "22222222-2222-4222-8222-222222222222";

function actionForm(values: Record<string, string>): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(values)) form.set(key, value);
  return form;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.config.mockReturnValue({
    url: "https://example.supabase.co",
    key: "publishable",
  });
  mocks.authenticatedClient.mockResolvedValue(client);
  client.from.mockReturnValue(membership);
  mocks.secretClient.mockReturnValue({ from: vi.fn().mockReturnValue(lookup) });
  client.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
  client.auth.signInWithPassword.mockResolvedValue({ error: null });
  client.auth.signOut.mockResolvedValue({ error: null });
  membership.maybeSingle.mockResolvedValue({
    data: { user_id: userId },
    error: null,
  });
  lookup.maybeSingle.mockResolvedValue({
    data: { display_name: "Dr. Guest" },
    error: null,
  });
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SECRET_KEY", "server-secret-for-tests");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://wedding.example");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("single-line invitation names", () => {
  it.each(titlePresets)(
    "supports title %j with a customized display name",
    (title) => {
      const input = {
        ...guest,
        title,
        display_name: "Our dear friends & family",
      };
      expect(invitationInputSchema.parse(input)).toEqual(input);
    },
  );

  it.each([
    "Jos\u00e9 O'Connor-Silva & Family",
    "\u0db1\u0dd2\u0db8\u0dbd\u0dca",
    "\u674e\u660e",
    "\u0d9a\u0dca\u200d\u0dbb",
  ])("allows international names and punctuation: %s", (name) => {
    expect(
      invitationInputSchema.safeParse({
        ...guest,
        guest_name: name,
        display_name: name,
      }).success,
    ).toBe(true);
  });

  it.each([
    "\n",
    "\r",
    "\t",
    "\0",
    "\u007f",
    "\u0085",
    "\u2028",
    "\u2029",
    "\u202e",
    "\u2066",
  ])(
    "rejects control/line/direction character %j before trimming",
    (control) => {
      for (const field of ["guest_name", "display_name"] as const) {
        for (const name of [
          `${control}Guest`,
          `Guest${control}`,
          `A${control}B`,
        ]) {
          expect(
            invitationInputSchema.safeParse({ ...guest, [field]: name })
              .success,
          ).toBe(false);
        }
      }
    },
  );

  it("trims spaces and enforces a 160-character limit on both names", () => {
    expect(
      invitationInputSchema.parse({ ...guest, guest_name: "  Guest  " })
        .guest_name,
    ).toBe("Guest");
    for (const field of ["guest_name", "display_name"] as const) {
      expect(
        invitationInputSchema.safeParse({ ...guest, [field]: "a".repeat(160) })
          .success,
      ).toBe(true);
      expect(
        invitationInputSchema.safeParse({ ...guest, [field]: "a".repeat(161) })
          .success,
      ).toBe(false);
      expect(
        invitationInputSchema.safeParse({ ...guest, [field]: "   " }).success,
      ).toBe(false);
    }
  });
});

describe("invitation tokens", () => {
  it("generates unique 192-bit URL-safe tokens and accepts uppercase", () => {
    const tokens = new Set(
      Array.from({ length: 1000 }, generateInvitationToken),
    );
    expect(tokens.size).toBe(1000);
    for (const token of tokens) {
      expect(token).toHaveLength(32);
      expect(tokenSchema.safeParse(token).success).toBe(true);
    }
    expect(tokenSchema.safeParse("UPPERCASE_token-123").success).toBe(true);
  });

  it("normalizes custom tokens but rejects short, invalid, or multiline URL tokens", () => {
    expect(normalizeCustomToken("  A Private LINK  ")).toBe("a-private-link");
    expect(
      createInvitationSchema.safeParse({
        ...guest,
        token_mode: "custom",
        custom_token: " A Private LINK ",
      }).success,
    ).toBe(true);
    expect(
      createInvitationSchema.safeParse({
        ...guest,
        token_mode: "custom",
        custom_token: "short",
      }).success,
    ).toBe(false);
    for (const token of [
      "short",
      "a".repeat(129),
      "abcdefgh\n",
      "abc/defg",
      "abc defg",
    ]) {
      expect(tokenSchema.safeParse(token).success).toBe(false);
    }
  });
});

describe("administrator authorization", () => {
  it("requires a verified user followed by their allowlist membership", async () => {
    expect(await requireAdmin()).toBe(client);
    expect(client.auth.getUser).toHaveBeenCalledOnce();
    expect(client.from).toHaveBeenCalledWith("admin_users");
    expect(membership.select).toHaveBeenCalledWith("user_id");
    expect(membership.eq).toHaveBeenCalledWith("user_id", userId);
    expect(client.auth.getUser.mock.invocationCallOrder[0]).toBeLessThan(
      membership.maybeSingle.mock.invocationCallOrder[0],
    );
  });

  it("redirects gracefully when configuration or client initialization is unavailable", async () => {
    mocks.config.mockReturnValue(null);
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=configuration",
    );
    expect(mocks.authenticatedClient).not.toHaveBeenCalled();
    mocks.config.mockReturnValue({
      url: "https://example.supabase.co",
      key: "publishable",
    });
    mocks.authenticatedClient.mockRejectedValueOnce(
      new Error("private initialization detail"),
    );
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
  });

  it("denies unverified sessions without consulting membership", async () => {
    client.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: userId } },
      error: { message: "invalid session" },
    });
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
    expect(client.from).not.toHaveBeenCalled();
  });

  it("denies missing/revoked memberships and sanitizes authentication/database failures", async () => {
    membership.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
    membership.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private database detail" },
    });
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
    client.auth.getUser.mockRejectedValueOnce(new Error("private auth detail"));
    await expect(requireAdmin()).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
  });
});

describe("public invitation resolution", () => {
  it("selects only the display name for the exact is_active token", async () => {
    await expect(resolveInvitation("UPPERCASE_token-123")).resolves.toEqual({
      display_name: "Dr. Guest",
    });
    expect(mocks.noStore).toHaveBeenCalledOnce();
    expect(lookup.select).toHaveBeenCalledWith("display_name");
    expect(lookup.eq.mock.calls).toEqual([
      ["token", "UPPERCASE_token-123"],
      ["is_active", true],
    ]);
    expect(lookup.maybeSingle).toHaveBeenCalledOnce();
    expect(mocks.secretClient.mock.calls[0][1]).toBe("server-secret-for-tests");
  });

  it("disables caching on its Supabase fetch", async () => {
    await resolveInvitation("abcdefgh");
    const fetcher = mocks.secretClient.mock.calls[0][2].global.fetch;
    const fetch = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetch);
    await fetcher("https://example.supabase.co/rest/v1/invitations", {
      method: "GET",
      cache: "force-cache",
    });
    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
      method: "GET",
      cache: "no-store",
    });
  });

  it("returns null for invalid or unavailable invitation tokens", async () => {
    await expect(resolveInvitation("bad/token")).resolves.toBeNull();
    expect(mocks.secretClient).not.toHaveBeenCalled();
    lookup.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(resolveInvitation("abcdefgh")).resolves.toBeNull();
  });

  it("throws only a sanitized error for configuration, database, or network failures", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    await expect(resolveInvitation("abcdefgh")).rejects.toThrow(
      "Invitation service is unavailable.",
    );
    vi.stubEnv("SUPABASE_SECRET_KEY", "server-secret-for-tests");
    lookup.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private database detail" },
    });
    await expect(resolveInvitation("abcdefgh")).rejects.toThrow(
      "Invitation service is unavailable.",
    );
    lookup.maybeSingle.mockRejectedValueOnce(
      new Error("private network detail"),
    );
    await expect(resolveInvitation("abcdefgh")).rejects.toThrow(
      "Invitation service is unavailable.",
    );
  });
});

describe("invitation creation results", () => {
  function form(tokenMode = "auto") {
    const values = new FormData();
    for (const [key, value] of Object.entries({
      ...guest,
      display_name: "Our Dear Friends",
      token_mode: tokenMode,
      custom_token: " A Private LINK ",
    }))
      values.set(key, value);
    return values;
  }

  it.each(["auto", "custom"])(
    "returns a guest name and canonical %s URL independently of search/pagination",
    async (mode) => {
      const insert = vi.fn().mockResolvedValue({ error: null });
      client.from.mockImplementation((table: string) =>
        table === "admin_users" ? membership : { insert },
      );
      const values = form(mode);
      values.set("q", "an unrelated search");
      values.set("page", "9");
      const result = await createInvitationAction({}, values);
      expect(result.error).toBeUndefined();
      expect(result.success).toBeTruthy();
      expect(result.invitation?.display_name).toBe("Our Dear Friends");
      const token = insert.mock.calls[0][0].token;
      expect(tokenSchema.safeParse(token).success).toBe(true);
      if (mode === "custom") expect(token).toBe("a-private-link");
      else expect(token).toHaveLength(32);
      expect(result.invitation?.url).toBe(
        `https://wedding.example/invite/${token}`,
      );
      expect(mocks.revalidatePath.mock.calls).toEqual([
        ["/admin"],
        ["/admin/guests"],
      ]);
      expect(mocks.secretClient).not.toHaveBeenCalled();
    },
  );

  it.each(["auto", "custom"])(
    "returns a friendly duplicate-token error for %s links without sharing or revalidating",
    async (mode) => {
      const insert = vi.fn().mockResolvedValue({
        error: { code: "23505", message: "private database detail" },
      });
      client.from.mockImplementation((table: string) =>
        table === "admin_users" ? membership : { insert },
      );
      const result = await createInvitationAction({}, form(mode));
      expect(result).toEqual({
        error: "That invitation link is already in use. Choose another token.",
      });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );

  it("authorizes before any invitation write, even for forged form submissions", async () => {
    membership.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(createInvitationAction({}, form())).rejects.toThrow(
      "REDIRECT:/admin/login?notice=access",
    );
    expect(client.from.mock.calls).toEqual([["admin_users"]]);
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects multiline names before writing a record", async () => {
    const values = form();
    values.set("display_name", "Guest\nName");
    const result = await createInvitationAction({}, values);
    expect(result).toEqual({
      error: "Use a single-line name without control characters.",
    });
    expect(client.from.mock.calls).toEqual([["admin_users"]]);
  });
});

describe("administrator login", () => {
  function credentials() {
    return actionForm({
      email: "admin@example.com",
      password: "test-password",
    });
  }

  const denied = {
    error:
      "Unable to sign in with administrator access. Check your details or try again later.",
  };

  it("redirects an approved administrator only after password, identity, and membership verification", async () => {
    await expect(loginAction({}, credentials())).rejects.toThrow(
      "REDIRECT:/admin",
    );
    expect(client.auth.signInWithPassword).toHaveBeenCalledExactlyOnceWith({
      email: "admin@example.com",
      password: "test-password",
    });
    expect(client.auth.getUser).toHaveBeenCalledOnce();
    expect(
      client.auth.signInWithPassword.mock.invocationCallOrder[0],
    ).toBeLessThan(client.auth.getUser.mock.invocationCallOrder[0]);
    expect(client.auth.getUser.mock.invocationCallOrder[0]).toBeLessThan(
      membership.maybeSingle.mock.invocationCallOrder[0],
    );
    expect(client.from.mock.calls).toEqual([["admin_users"]]);
    expect(membership.eq).toHaveBeenCalledWith("user_id", userId);
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(mocks.secretClient).not.toHaveBeenCalled();
  });

  it("rejects a signed-in non-administrator and clears the local session", async () => {
    membership.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    await expect(loginAction({}, credentials())).resolves.toEqual(denied);
    expect(client.auth.signOut).toHaveBeenCalledExactlyOnceWith({
      scope: "local",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(client.from.mock.calls).toEqual([["admin_users"]]);
  });

  it("sanitizes invalid-credential errors without consulting user identity or membership", async () => {
    client.auth.signInWithPassword.mockResolvedValueOnce({
      error: { message: "private credential error" },
    });
    await expect(loginAction({}, credentials())).resolves.toEqual(denied);
    expect(client.auth.getUser).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
    expect(client.auth.signOut).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    { data: { user: null }, error: null },
    {
      data: { user: { id: userId } },
      error: { message: "private verification error" },
    },
  ])(
    "rejects an unverified identity after a successful password response: %j",
    async (verification) => {
      client.auth.getUser.mockResolvedValueOnce(verification);
      await expect(loginAction({}, credentials())).resolves.toEqual(denied);
      expect(client.from).not.toHaveBeenCalled();
      expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it("fails closed on membership query errors and clears the local session", async () => {
    membership.maybeSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "private membership error" },
    });
    await expect(loginAction({}, credentials())).resolves.toEqual(denied);
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["client", "password", "identity", "membership"])(
    "sanitizes thrown %s failures rather than rejecting the login action",
    async (step) => {
      const error = new Error("private authentication infrastructure detail");
      if (step === "client")
        mocks.authenticatedClient.mockRejectedValueOnce(error);
      if (step === "password")
        client.auth.signInWithPassword.mockRejectedValueOnce(error);
      if (step === "identity") client.auth.getUser.mockRejectedValueOnce(error);
      if (step === "membership")
        membership.maybeSingle.mockRejectedValueOnce(error);
      await expect(loginAction({}, credentials())).resolves.toEqual({
        error: "Sign-in is unavailable. Please wait and try again.",
      });
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(mocks.secretClient).not.toHaveBeenCalled();
    },
  );

  it("handles missing configuration and invalid credentials before creating a client", async () => {
    mocks.config.mockReturnValueOnce(null);
    await expect(loginAction({}, credentials())).resolves.toEqual({
      error: "Authentication is not configured. Contact the site owner.",
    });
    await expect(
      loginAction({}, actionForm({ email: "not-an-email", password: "" })),
    ).resolves.toEqual({ error: "Enter a valid email address and password." });
    expect(mocks.authenticatedClient).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("invitation lifecycle mutations", () => {
  function fixture(isActive = true) {
    const row = {
      id: invitationId,
      ...guest,
      token: "old-private-invitation-token",
      is_active: isActive,
    };
    const write = query();
    const update = vi.fn((changes: Partial<typeof row>) => {
      Object.assign(row, changes);
      return write;
    });
    write.maybeSingle.mockResolvedValue({
      data: { id: invitationId },
      error: null,
    });
    client.from.mockImplementation((table: string) =>
      table === "admin_users" ? membership : { update },
    );
    mocks.secretClient.mockReturnValue({
      from: vi.fn(() => {
        const filters = new Map<string, unknown>();
        const read = query();
        read.eq.mockImplementation((column: string, value: unknown) => {
          filters.set(column, value);
          return read;
        });
        read.maybeSingle.mockImplementation(async () => ({
          data:
            filters.get("token") === row.token &&
            filters.get("is_active") === row.is_active
              ? { display_name: row.display_name }
              : null,
          error: null,
        }));
        return read;
      }),
    });
    return { row, write, update };
  }

  it("edits guest/title/display names without changing the token or activation state, ignoring forged fields", async () => {
    const { row, write, update } = fixture(false);
    const token = row.token;
    const details = {
      guest_name: "Updated Guest",
      title: "Dr.",
      display_name: "Our Dear Friend",
    };
    await expect(
      updateInvitationAction(
        {},
        actionForm({
          id: invitationId,
          ...details,
          token: "forged-replacement-token",
          is_active: "true",
        }),
      ),
    ).resolves.toEqual({
      success: "Guest details saved. The invitation link has not changed.",
    });
    expect(update).toHaveBeenCalledExactlyOnceWith(details);
    expect(write.eq).toHaveBeenCalledExactlyOnceWith("id", invitationId);
    expect(write.select).toHaveBeenCalledExactlyOnceWith("id");
    expect(write.maybeSingle).toHaveBeenCalledOnce();
    expect(row).toMatchObject({ ...details, token, is_active: false });
    expect(randomBytes).not.toHaveBeenCalled();
    expect(mocks.secretClient).not.toHaveBeenCalled();
    expect(mocks.revalidatePath.mock.calls).toEqual([
      ["/admin"],
      ["/admin/guests"],
    ]);
  });

  it("deactivates with is_active false only, preserving the token and making its public resolver return null", async () => {
    const { row, write, update } = fixture();
    const token = row.token;
    await expect(
      changeInvitationAction(
        {},
        actionForm({ id: invitationId, operation: "deactivate" }),
      ),
    ).resolves.toEqual({
      success: "Invitation deactivated. Its link no longer works.",
    });
    expect(update).toHaveBeenCalledExactlyOnceWith({ is_active: false });
    expect(write.eq).toHaveBeenCalledExactlyOnceWith("id", invitationId);
    expect(row).toMatchObject({ token, is_active: false });
    expect(randomBytes).not.toHaveBeenCalled();
    expect(mocks.secretClient).not.toHaveBeenCalled();
    await expect(resolveInvitation(token)).resolves.toBeNull();
  });

  it.each([true, false])(
    "regenerates 24 cryptographic random bytes, replaces the old token, and preserves is_active=%s",
    async (isActive) => {
      const { row, write, update } = fixture(isActive);
      const oldToken = row.token;
      await expect(
        changeInvitationAction(
          {},
          actionForm({ id: invitationId, operation: "regenerate" }),
        ),
      ).resolves.toEqual({
        success: "New link generated. The previous link no longer works.",
      });
      expect(randomBytes).toHaveBeenCalledExactlyOnceWith(24);
      expect(update).toHaveBeenCalledExactlyOnceWith({ token: row.token });
      expect(write.eq).toHaveBeenCalledExactlyOnceWith("id", invitationId);
      expect(row.token).not.toBe(oldToken);
      expect(tokenSchema.safeParse(row.token).success).toBe(true);
      expect(row.token).toHaveLength(32);
      expect(Buffer.from(row.token, "base64url")).toHaveLength(24);
      expect(row.is_active).toBe(isActive);
      expect(mocks.secretClient).not.toHaveBeenCalled();
      await expect(resolveInvitation(oldToken)).resolves.toBeNull();
      await expect(resolveInvitation(row.token)).resolves.toEqual(
        isActive ? { display_name: guest.display_name } : null,
      );
    },
  );
});

describe.each(["unauthenticated", "revoked"])(
  "%s mutation access",
  (access) => {
    const cases = [
      [
        "create",
        () =>
          createInvitationAction(
            {},
            actionForm({ ...guest, token_mode: "auto" }),
          ),
      ],
      [
        "update",
        () =>
          updateInvitationAction(
            {},
            actionForm({ id: invitationId, ...guest }),
          ),
      ],
      [
        "deactivate",
        () =>
          changeInvitationAction(
            {},
            actionForm({ id: invitationId, operation: "deactivate" }),
          ),
      ],
      [
        "activate",
        () =>
          changeInvitationAction(
            {},
            actionForm({ id: invitationId, operation: "activate" }),
          ),
      ],
      [
        "regenerate",
        () =>
          changeInvitationAction(
            {},
            actionForm({ id: invitationId, operation: "regenerate" }),
          ),
      ],
    ] as const;

    it.each(cases)(
      "blocks %s before any invitation write or sign-out",
      async (_name, invoke) => {
        if (access === "unauthenticated") {
          client.auth.getUser.mockResolvedValueOnce({
            data: { user: null },
            error: null,
          });
        } else {
          membership.maybeSingle.mockResolvedValueOnce({
            data: null,
            error: null,
          });
        }
        await expect(invoke()).rejects.toThrow(
          "REDIRECT:/admin/login?notice=access",
        );
        expect(client.auth.getUser).toHaveBeenCalledOnce();
        expect(client.from.mock.calls).toEqual(
          access === "revoked" ? [["admin_users"]] : [],
        );
        expect(client.auth.signOut).not.toHaveBeenCalled();
        expect(client.auth.signInWithPassword).not.toHaveBeenCalled();
        expect(randomBytes).not.toHaveBeenCalled();
        expect(mocks.secretClient).not.toHaveBeenCalled();
        expect(mocks.revalidatePath).not.toHaveBeenCalled();
      },
    );
  },
);

describe("administrator logout", () => {
  it("signs out locally without requiring administrator membership, then redirects", async () => {
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/admin/login");
    expect(client.auth.signOut).toHaveBeenCalledExactlyOnceWith({
      scope: "local",
    });
    expect(client.auth.getUser).not.toHaveBeenCalled();
    expect(client.from).not.toHaveBeenCalled();
    expect(mocks.secretClient).not.toHaveBeenCalled();
  });

  it("sanitizes client initialization errors", async () => {
    mocks.authenticatedClient.mockRejectedValueOnce(new Error("private configuration"));
    await expect(logoutAction()).resolves.toEqual({ error: "Could not sign out. Please try again." });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["returned", "thrown"])(
    "returns a sanitized error for %s sign-out failures without redirecting",
    async (failure) => {
      if (failure === "returned")
        client.auth.signOut.mockResolvedValueOnce({
          error: { message: "private sign-out detail" },
        });
      else
        client.auth.signOut.mockRejectedValueOnce(
          new Error("private sign-out detail"),
        );
      await expect(logoutAction()).resolves.toEqual({
        error: "Could not sign out. Please try again.",
      });
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
