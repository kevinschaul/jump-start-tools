import * as path from "path";
import { readFileSync, readdirSync, statSync } from "fs";
import Link from "next/link";
import {
  getStarterCommand,
  parseStarters,
  type Starter,
} from "../../util/parseStarters";
import Image from "next/image";

const basePath = process.env.NEXT_JS_BASE_PATH;

export default async function Home() {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));

  const startersWithPreviews = Object.values(starters)
    .flat()
    .filter((d) => d.preview);

  return (
    <div>
      <h1>Jump start</h1>
      <p>
        A shortcut to your favorite code.{" "}
        <a href="https://github.com/kevinschaul/jump-start-template">
          Set up your own here.
        </a>
      </p>

      <hr />

      <h2>Starters with previews</h2>
      <p>
        To get your starter to show up here, add a `preview` entry to its
        `jump-start.yaml` file. See{" "}
        <a href="https://github.com/kevinschaul/jump-start-template?tab=readme-ov-file#jump-startyaml">
          the docs{" "}
        </a>{" "}
        for more information.
      </p>

      <div className="starter-preview-mini-wrap">
        {startersWithPreviews.map((starter) => {
          return (
            <div key={starter.title} className="starter-preview-mini">
              <Link href={`/${starter.dir}`}>
                <div className="image-wrap">
                  <Image
                    src={`${basePath}/screenshots/${starter.group}/${starter.title}.png`}
                    alt={`Preview of ${starter.title}`}
                    fill={true}
                  />
                </div>
                <h3>
                  {starter.group}/<b>{starter.title}</b>
                </h3>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
