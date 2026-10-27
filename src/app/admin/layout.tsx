import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Invitation Studio", template: "%s | Invitation Studio" },
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="admin-shell">{children}</div>;
}
