import { Players, RunService } from "@rbxts/services";
import { makeHello } from "shared/module";
import { getLeaderstatsForPlayer } from "./leaderstats";
import { generateObby } from "./obbygenerator";
import { createObbyPart, createRandomObbyPart, ObbyPart } from "./obbypartloader";
import SpawnManager from "./spawnmanager";

const beginningObbyPart = createObbyPart("beginning");

assert(beginningObbyPart !== undefined);

function onPlayerAdded(ply: Player) {
    const leaderstats = getLeaderstatsForPlayer(ply);
    leaderstats.addStat("Stage", "number", 1);

    SpawnManager.spawnPlayerAt(ply, beginningObbyPart!.StartPart.CFrame);
}

Players.PlayerAdded.Connect(onPlayerAdded);

if (RunService.IsStudio()) {
    for (const ply of Players.GetPlayers()) {
        onPlayerAdded(ply);
    }
}

if (beginningObbyPart !== undefined) {
    beginningObbyPart.StageNumber = 1;
    beginningObbyPart.AttachTo(undefined); // Setting CFrame to origin of world (0,0,0 with euler angles of 0,0,0)

    generateObby(beginningObbyPart)
        .then((map) => {
            print("Generated obby");
        })
        .catch((reason) => warn(reason));
}
