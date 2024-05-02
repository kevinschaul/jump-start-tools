import type { Metadata } from "next";
import path from "path";
import "./globals.css";
import { parseStarters } from "../../util/parseStarters";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Jump start",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));

  return (
    <html lang="en">
      <body>
        <div className="sidebar">
          <h2>
            <Link href="/">Jump start</Link>
          </h2>
          <p>
            Add a starter{" "}
            <Link href="https://github.com/kevinschaul/jump-start/">
              on Github
            </Link>
          </p>
          <ul>
            {Object.keys(starters).map((group) => {
              const startersThisGroup = starters[group];
              return (
                <li key={group}>
                  {group}
                  <ul>
                    {startersThisGroup.map((starter) => {
                      return (
                        <li key={starter.title}>
                          <Link href={`/${starter.dir}`}>{starter.title}</Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="main">{children}</div>
      </body>
    </html>
  );
}
