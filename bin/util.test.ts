import { describe, expect, it } from "vitest";
import { parseStarterString } from "./util";

describe("parseStarterString", () => {
  it("handles group/name", () => {
    const result = parseStarterString("my-group/my-starter");
    expect(result).toEqual({
      instanceName: null,
      groupName: "my-group",
      starterName: "my-starter",
    });
  });

  it("handles instance/group/name", () => {
    const result = parseStarterString("my-instance/my-group/my-starter");
    expect(result).toEqual({
      instanceName: "my-instance",
      groupName: "my-group",
      starterName: "my-starter",
    });
  });

  it("errors with only one component", () => {
    expect(() => {
      return parseStarterString("my-starter");
    }).toThrowError();
  });
});
