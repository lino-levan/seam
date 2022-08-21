/*
    All of this code is stolen directly from https://github.com/FabricMC/fabricmc.net/tree/main/scripts/src/lib
    I'm not insane enough to write this myslef
*/

import {
  getApiVersions,
  getGameVersions,
  getLoaderVersions,
  getYarnVersions,
} from "./api.ts";

export async function getLatestVersion() {
  let minecraftVersion = "";

  await getGameVersions().then((versions) => {
    minecraftVersion = versions.find((v) => v.stable)!.version;
  });

  return minecraftVersion;
}

export async function getVersions(stableOnly = true) {
  return await (await getGameVersions()).filter((v) =>
    stableOnly ? v.stable : true
  ).map((v) => v.version);
}

export async function getApiYarnVersion(minecraftVersion: string) {
  let yarnVersion = "";
  let loaderVersion = "";
  let apiVersion = "";

  const yarnVersions = getYarnVersions();
  const _loaderVersions = getLoaderVersions().then((versions) => {
    loaderVersion = versions.find((v) => v.stable)!.version;
    return versions;
  });
  const apiVersions = getApiVersions();

  await yarnVersions.then((versions) =>
    yarnVersion = versions.find((v) =>
      v.gameVersion == minecraftVersion
    )?.version || "unknown"
  );
  await apiVersions.then((versions) =>
    apiVersion = versions.filter((v) => validForMcVersion(v, minecraftVersion))
      .pop()!
  );

  return {
    yarn: yarnVersion,
    api: apiVersion,
    loader: loaderVersion,
  };
}

function validForMcVersion(
  apiVersion: string,
  mcVersion: string | undefined,
): boolean {
  if (!mcVersion) {
    return false;
  }

  let branch = mcVersion;

  const versionBranches = [
    "1.14",
    "1.15",
    "1.16",
    "1.17",
    "1.18",
    "1.19",
    "20w14infinite",
    "1.18_experimental",
  ];

  versionBranches.forEach((v) => {
    if (mcVersion.startsWith(v)) {
      branch = v;
    }
  });

  // Very dumb but idk of a better (easy) way.
  if (mcVersion.startsWith("22w13oneblockatatime")) {
    branch = "22w13oneblockatatime";
  } else if (mcVersion.startsWith("22w")) {
    branch = "1.19";
  } else if (mcVersion.startsWith("1.18.2")) {
    branch = "1.18.2";
  } else if (mcVersion.startsWith("1.19.1")) {
    branch = "1.19.1";
  } else if (mcVersion.startsWith("1.19.2")) {
    branch = "1.19.2";
  } else if (mcVersion.startsWith("21w")) {
    branch = "1.18";
  } else if (mcVersion.startsWith("20w")) {
    branch = "1.17";
  } else if (mcVersion.startsWith("19w") || mcVersion.startsWith("18w")) {
    branch = "1.14";
  }

  return apiVersion.endsWith("-" + branch) || apiVersion.endsWith("+" + branch);
}
