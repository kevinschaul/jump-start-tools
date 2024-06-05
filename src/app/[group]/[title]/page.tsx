import * as path from "path";
import dynamic from "next/dynamic";
import Markdown from "react-markdown";
import CopyableCommand from "../../CopyableCommand";
import {
  getStarterCommand,
  parseStarters,
  getStarterFiles,
  type Starter,
} from "../../../../util/parseStarters";
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
    const files = await getStarterFiles(
      path.join(process.cwd(), "./src/starters/", starter.dir),
    );

    return (
      <>
        <header>
          <h1>
            {params.group}/ <b>{params.title}</b>
          </h1>
          <a
            href={`https://www.github.com/${process.env.GITHUB_USERNAME}/${process.env.GITHUB_REPO}/tree/main/${params.group}/${params.title}`}
          >
            View this starter on GitHub
          </a>
        </header>

        <Markdown>{starter.description}</Markdown>

        <hr />

        <h3>Use this starter</h3>
        <CopyableCommand
          command={getStarterCommand(
            starter,
            process.env.GITHUB_USERNAME,
            process.env.GITHUB_REPO,
            process.env.DEGIT_MODE,
          )}
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
