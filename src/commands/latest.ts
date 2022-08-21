import { getLatestVersion } from "../getVersions/getVersions.ts";

export async function latest() {
  const latestVersion = await getLatestVersion();
  console.log(latestVersion);
}
