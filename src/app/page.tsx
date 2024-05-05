import Link from "next/link";
import { componentMap } from "./componentMap";
import PreviewWrap from "./PreviewWrap";

export default function Home() {
  return (
    <div>
      <h1>Jump start</h1>
      <p>
        A shortcut to your favorite code.{" "}
        <a href="https://github.com/kevinschaul/jump-start-template">
          Set up your own here.
        </a>
      </p>

      <h3>Starters with previews</h3>

      {Object.keys(componentMap).map((d) => {
        return (
          <div key={d}>
            <h4><Link href={`/${d}`}>{d}</Link></h4>
            <PreviewWrap dir={d} />
          </div>
        );
      })}
    </div>
  );
}
