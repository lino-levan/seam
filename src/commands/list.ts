import { getVersions } from "../getVersions/getVersions.ts";

export async function list(parsedArgs: {
  [x: string]: any;
  _: (string | number)[];
}) {
  const versions = await getVersions(parsedArgs.all ? false : true);
  versions.forEach((v) => console.log(v));
}
