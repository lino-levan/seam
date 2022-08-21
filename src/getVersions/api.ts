import { DOMParser } from "https://esm.sh/linkedom@0.14.12";

export interface GameVersion {
  version: string;
  stable: boolean;
}

export interface InstallerVersion {
  stable: boolean;
  url: string;
  version: string;
  maven: string;
}

export interface LoaderVersion {
  separator: string;
  build: number;
  maven: string;
  version: string;
  stable: boolean;
}

export interface YarnVersion {
  gameVersion: string;
  separator: string;
  build: number;
  maven: string;
  version: string;
  stable: boolean;
}

export function getInstallerVersions() {
  return getJson<InstallerVersion[]>(
    "https://meta.fabricmc.net/v2/versions/installer",
  );
}

export function getGameVersions() {
  return getJson<GameVersion[]>("https://meta.fabricmc.net/v2/versions/game");
}

export function getLoaderVersions() {
  return getJson<LoaderVersion[]>(
    "https://meta.fabricmc.net/v2/versions/loader",
  );
}

export function getYarnVersions() {
  return getJson<YarnVersion[]>("https://meta.fabricmc.net/v2/versions/yarn");
}

export function getLauncherProfile(
  minecraftVersion: string,
  loaderVersion: string,
) {
  return getJson<any>(
    `https://meta.fabricmc.net/v2/versions/loader/${minecraftVersion}/${loaderVersion}/profile/json`,
  );
}

export function getJavadocList() {
  return getText("https://maven.fabricmc.net/jdlist.txt").then((list) =>
    list.split("\n")
  );
}

export async function getLatestYarnVersion(
  gameVersion: string,
): Promise<YarnVersion | undefined> {
  return (await getJson<YarnVersion[]>(
    `https://meta.fabricmc.net/v2/versions/yarn/${gameVersion}?limit=1`,
  ))[0];
}

export async function getApiVersions(): Promise<string[]> {
  const metadata = await getText(
    "https://maven.fabricmc.net/net/fabricmc/fabric-api/fabric-api/maven-metadata.xml",
  );
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(metadata, "text/xml");
  const versions = Array.from(xmlDoc!.getElementsByTagName("version")).map((
    v,
  ) => v.childNodes[0].nodeValue as string);
  return versions;
}

async function getJson<T>(url: string) {
  const response = await fetch(url);

  if (response.ok) {
    return (await response.json()) as T;
  } else {
    throw new Error(`Failed to fetch versions (Code: ${response.status})`);
  }
}

async function getText(url: string): Promise<string> {
  const response = await fetch(url);

  if (response.ok) {
    return (await response.text());
  } else {
    throw new Error(`Failed to fetch versions (Code: ${response.status})`);
  }
}
