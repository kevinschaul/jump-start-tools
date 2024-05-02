import _starters from "../../../starters.json";
import type { GroupLookup, Starter } from "../../../../util/parseStarters";
import * as path from "path";
import { readFileSync, readdirSync, statSync } from "fs";
import CopyableCommand from "../../CopyableCommand";
import StarterFile from "../../StarterFile";

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
        <h1>
          {params.group}/<b>{params.title}</b>
        </h1>

        <CopyableCommand
          command={`npx degit kevinschaul/jump-start/${starter.dir} ${starter.defaultDir || starter.dir}`}
        />

        <a href={`https://www.github.com/kevinschaul/jump-start/tree/main/${params.group}/${params.title}`}>View on GitHub</a>

        {starter.description?.split("\n").map((d, i) => {
          return <p key={i}>{d}</p>;
        })}

        {/* {starter.tags?.length && ( */}
        {/*   <div> */}
        {/*     Tags:{" "} */}
        {/*     {starter.tags.map((d) => ( */}
        {/*       <a className="tag" key={d} href={`/tag/${d}/`}> */}
        {/*         {d} */}
        {/*       </a> */}
        {/*     ))} */}
        {/*   </div> */}
        {/* )} */}

        <hr />

        <div>
          {files.map((d) => {
            return (
              <StarterFile key={d.path} path={d.path} contents={d.contents} />
            );
          })}
        </div>
      </>
    );
  }
}

async function getStarter(
  group: string,
  title: string,
): Promise<Starter | undefined> {
  const starters: GroupLookup = _starters;
  return starters[group].find((d) => d.title === title);
}

async function getStarterFiles(dirPath: string) {
  const files = readdirSync(dirPath);
  let out = [];

  for (const file of files) {
    if (!["jump-start.yaml", "degit.json"].includes(file)) {
      const filePath = path.join(dirPath, file);
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
  const starters: GroupLookup = _starters;

  let combinations: Params[] = [];
  for (const key of Object.keys(starters)) {
    for (const starter of starters[key]) {
      combinations.push({ group: starter.group, title: starter.title });
    }
  }
  return combinations;
}
