import { parse } from "https://deno.land/std@0.152.0/flags/mod.ts";
import { install, latest, list } from "./src/commands/commands.ts";

const parsedArgs = parse(Deno.args);

switch (parsedArgs._[0]) {
  case "help": {
    console.log(
      "HELP\n- help: Make this screen show up\n- list: List all available mc versions\n- latest: Get the latest mc version\n- install: Setup a fabric environment for a new mod",
    );
    break;
  }

  case "list": {
    list(parsedArgs);
    break;
  }

  case "latest": {
    latest();
    break;
  }

  case "install": {
    install(parsedArgs);
    break;
  }

  default:
    console.log("Unrecognized command", parsedArgs._[0]);
    break;
}
