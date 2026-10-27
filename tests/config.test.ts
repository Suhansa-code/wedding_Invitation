import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { supabaseConfig, supabaseUrl } from "../src/lib/supabase/env";

afterEach(() => vi.unstubAllEnvs());

describe("Supabase transport configuration", () => {
  it("accepts HTTPS origins with a publishable key", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co/");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "publishable-key");
    expect(supabaseConfig()).toEqual({ url: "https://project.supabase.co", key: "publishable-key" });
  });

  it.each([
    "http://project.supabase.co",
    "http://localhost:54321",
    "https://user:password@project.supabase.co",
    "https://project.supabase.co/rest/v1",
    "https://project.supabase.co?query=1",
    "https://project.supabase.co#fragment",
    "file:///tmp/project",
    "not-a-url",
    "",
  ])("rejects unsafe production URL %s", (url) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url);
    expect(supabaseUrl()).toBeNull();
  });

  it("allows local HTTP only in development and fails closed without a key", () => {
    vi.stubEnv("NODE_ENV", "development");
    for (const host of ["localhost", "127.0.0.1", "[::1]"]) {
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `http://${host}:54321`);
      expect(supabaseUrl()).toBe(`http://${host}:54321`);
    }
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    expect(supabaseConfig()).toBeNull();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://untrusted.example");
    expect(supabaseUrl()).toBeNull();
  });
});
