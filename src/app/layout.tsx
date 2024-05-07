import type { Metadata } from "next";
import path from "path";
import "./global.scss";
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
        <nav>
          <p className="site-title">
            <Link href="/">Jump start</Link>
          </p>
          <p>
            <a href="https://github.com/kevinschaul/jump-start-template/">
              Fork on GitHub
            </a>
          </p>
        </nav>
        <main>
          <div className="sidebar">
            <div>
              {Object.keys(starters).map((group) => {
                const startersThisGroup = starters[group];
                return (
                  <div key={group}>
                    <p>{group}/</p>
                    <ul>
                      {startersThisGroup.map((starter) => {
                        return (
                          <li key={starter.title}>
                            <Link href={`/${starter.dir}`}>
                              {starter.title}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="content">{children}</div>
        </main>
      </body>
    </html>
  );
}
