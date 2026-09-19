import "./globals.css";

export const metadata = {
  title: "Sovereign AI Workbench (SIH26117)",
  description: "On-Premise Agentic AI Workbench - Secure, Local, Evidence-Grounded Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

