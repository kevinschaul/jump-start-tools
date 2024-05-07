import * as path from "path";
import { readFileSync, readdirSync, statSync } from "fs";
import dynamic from "next/dynamic";
import CopyableCommand from "../../CopyableCommand";
import { parseStarters, type Starter } from "../../../../util/parseStarters";
const StarterPreview = dynamic(() => import("../../StarterPreview"), {
  ssr: false,
});

type Params = {
  group: string;
  title: string;
};

export default async function Starter({ params }: { params: Params }) {
  const starter = await getStarter(params.group, params.title);
  if (!starter) {
    return null;
  } else {
    const files = await getStarterFiles(starter.dir);

    return (
      <>
        <header>
          <h1>
            {params.group}/ <b>{params.title}</b>
          </h1>
          <a
            href={`https://www.github.com/kevinschaul/jump-start/tree/main/${params.group}/${params.title}`}
          >
            View this starter on GitHub
          </a>
        </header>

        {starter.description?.split("\n").map((d, i) => {
          return <p key={i}>{d}</p>;
        })}

        <hr />

        <h3>Use this starter</h3>
        <CopyableCommand
          command={`npx degit kevinschaul/jump-start/${starter.dir} \\\n  ${starter.defaultDir || starter.dir}`}
        />
        <p>
          Enter that command in your terminal, adjusting the last argument if
          you want the starter files to end up somewhere else.
        </p>

        <StarterPreview files={files} starter={starter} />
      </>
    );
  }
}

async function getStarter(
  group: string,
  title: string,
): Promise<Starter | undefined> {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));
  return starters[group].find((d) => d.title === title);
}

async function getStarterFiles(dirPath: string) {
  const basePath = path.join(process.cwd(), "./src/starters/");
  const files = readdirSync(path.join(basePath, dirPath));
  let out = [];

  for (const file of files) {
    if (!["jump-start.yaml", "degit.json"].includes(file)) {
      const filePath = path.join(basePath, dirPath, file);
      const stats = statSync(filePath);
      if (stats.isDirectory()) {
        out.push({
          path: file,
          type: "dir",
        });
      } else {
        out.push({
          path: file,
          type: "file",
          contents: readFileSync(filePath, "utf8"),
        });
      }
    }
  }

  return out;
}

export async function generateStaticParams() {
  const starters = parseStarters(path.join(process.cwd(), "./src/starters/"));

  let combinations: Params[] = [];
  for (const key of Object.keys(starters)) {
    for (const starter of starters[key]) {
      combinations.push({ group: starter.group, title: starter.title });
    }
  }
  return combinations;
}
