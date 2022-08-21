import {
  getApiYarnVersion,
  getLatestVersion,
} from "../getVersions/getVersions.ts";
import { ensureDir, walkSync } from "https://deno.land/std@0.152.0/fs/mod.ts";
import { platform } from "https://deno.land/std@0.152.0/node/os.ts";

export async function install(parsedArgs: {
  [x: string]: any;
  _: (string | number)[];
}) {
  // Get minecraft version
  const latestVersion = parsedArgs.version?.toString() ||
    prompt(
      "What minecraft version are you developing for?",
      await getLatestVersion(),
    );
  console.log("Installing version", latestVersion);

  // get yarn, api, and loader versions
  const apiYarn = await getApiYarnVersion(latestVersion);
  console.log("Detected versions", apiYarn);

  // get maven group name
  const mavenGroup: string = parsedArgs.mavenGroup?.toString() ||
    prompt("What would you like your maven group to be?", "com.example");

  // get mod id
  const modId: string = parsedArgs.modId?.toString() ||
    prompt("What would you like your mod id to be?", "fabric-example-mod");

  // clone the git repo
  console.log("Cloning example mod repo");
  const p = Deno.run({
    cmd: [
      "git",
      "clone",
      "https://github.com/FabricMC/fabric-example-mod.git",
      modId,
    ],
  });
  const status = await p.status();

  if (!status.success) return console.log("Failed to clone repo");

  console.log("Successfully cloned repo");

  // move directory to mod id
  await Deno.chdir(modId);

  // remove fluff files
  await Deno.remove(`README.md`);
  await Deno.remove(`LICENSE`);
  await Deno.remove(`gradle.properties`);
  await Deno.remove(`.git`, { recursive: true });
  console.log("Removed fluff files");

  // rename files
  await Deno.rename(
    `src/main/resources/modid.mixins.json`,
    `src/main/resources/${modId}.mixins.json`,
  );
  await Deno.rename(
    `src/main/resources/assets/modid`,
    `src/main/resources/assets/${modId}`,
  );
  await ensureDir(`src/main/java/${mavenGroup.replaceAll(".", "/")}`);
  for (const entry of Deno.readDirSync(`src/main/java/net/fabricmc/example`)) {
    await Deno.rename(
      `src/main/java/net/fabricmc/example/${entry.name}`,
      `src/main/java/${mavenGroup.replaceAll(".", "/")}/${entry.name}`,
    );
  }
  await Deno.remove(`src/main/java/net`, { recursive: true });
  console.log("Renamed files");

  // Create .seam
  const seam = {
    mcVersion: latestVersion,
    mavenGroup: mavenGroup,
    modId: modId,
  };
  await Deno.mkdir(".seam");
  await Deno.writeFile(
    ".seam/seam.json",
    new TextEncoder().encode(JSON.stringify(seam, null, 2)),
  );
  console.log("Created .seam");

  // Write gradle.properties
  await Deno.writeFile(
    `gradle.properties`,
    new TextEncoder().encode(`
  # Done to increase the memory available to gradle.
  org.gradle.jvmargs=-Xmx1G
  
  # Fabric Properties
    minecraft_version=${latestVersion}
    yarn_mappings=${apiYarn.yarn}
    loader_version=${apiYarn.loader}
  
  # Mod Properties
    mod_version = 1.0.0
    maven_group = ${mavenGroup}
    archives_base_name = ${modId}
  
  # Dependencies
    fabric_version=${apiYarn.api}
  `),
  );
  console.log("Updated gradle.properties");

  // Update fabric.mod.json
  const fabricModJson = JSON.parse(
    await Deno.readTextFile(`src/main/resources/fabric.mod.json`),
  );
  fabricModJson.id = modId;
  fabricModJson.icon = `assets/${modId}/icon.png`;
  fabricModJson.entrypoints.main = [`${mavenGroup}.ExampleMod`];
  fabricModJson.mixins = [`${modId}.mixins.json`];

  fabricModJson.name = parsedArgs.name?.toString() ||
    prompt("What would you like to name your mod?", "Example Mod");
  fabricModJson.description = parsedArgs.description?.toString() ||
    prompt(
      "Write a small description for your mod",
      "This is an example description!",
    );
  fabricModJson.author = parsedArgs.author?.toString()?.split(",") ||
    (prompt("List your mod authors (seperated by commas)", "Me!"))?.split(",");
  fabricModJson.contact.homepage = parsedArgs.homepage?.toString() ||
    (prompt("What is the url to your homepage?", "https://fabricmc.net/"));
  fabricModJson.contact.sources = parsedArgs.sources?.toString() ||
    (prompt(
      "What is the url to your sources?",
      "https://github.com/FabricMC/fabric-example-mod",
    ));

  delete fabricModJson.suggests;

  await Deno.writeFile(
    `src/main/resources/fabric.mod.json`,
    new TextEncoder().encode(JSON.stringify(fabricModJson, null, 2)),
  );
  console.log("Updated fabric.mod.json");

  // Update mixins.json
  const mixinJson = JSON.parse(
    await Deno.readTextFile(`src/main/resources/${modId}.mixins.json`),
  );
  mixinJson.package = `${mavenGroup}.mixin`;
  await Deno.writeFile(
    `src/main/resources/${modId}.mixins.json`,
    new TextEncoder().encode(JSON.stringify(mixinJson, null, 2)),
  );
  console.log(`Updated ${modId}.mixins.json`);

  // Update all java files
  for (
    const entry of walkSync(`src/main/java/${mavenGroup.replaceAll(".", "/")}`)
  ) {
    if (entry.isFile && entry.name.endsWith(".java")) {
      let javaFile = await Deno.readTextFile(entry.path);
      javaFile = javaFile.replaceAll("net.fabricmc.example", mavenGroup);
      javaFile = javaFile.replaceAll("modid", modId);
      await Deno.writeFile(entry.path, new TextEncoder().encode(javaFile));
      console.log("Updated", entry.name);
    }
  }
  console.log("Updated java files");

  // Generate sources
  const p2 = Deno.run({
    cmd: [platform() === "win32" ? "gradlew" : "./gradlew", "genSources"],
  });
  const status2 = await p2.status();
  if (!status2.success) return console.log("Failed to generate sources");
  console.log("Successfully generated sources");

  const p3 = Deno.run({
    cmd: [platform() === "win32" ? "gradlew" : "./gradlew", "vscode"],
  });
  const status3 = await p3.status();
  if (!status3.success) return console.log("Failed to generate vscode files");
  console.log("Successfully generated vscode files");

  console.log(
    "DONE!\n\nNext steps:\n- Open this project in vscode and wait for the java project to import.\n- That's it!",
  );
}
