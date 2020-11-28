import { Players, RunService } from "@rbxts/services";
import { makeHello } from "shared/module";
import { getLeaderstatsForPlayer } from "./leaderstats";
import { createObbyPart, createRandomObbyPart, ObbyPart } from "./obbypartloader";
import SpawnManager from "./spawnmanager";

const beginningObbyPart = createObbyPart("beginning");

const stages: ObbyPart[] = [];
const stageStarts: Map<number, ObbyPart> = new Map<number, ObbyPart>();

assert(beginningObbyPart !== undefined);

function onPlayerAdded(ply: Player) {
    print("leaderstats");
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

    stageStarts.set(1, beginningObbyPart);

    let lastObbyPart = beginningObbyPart;
    let stageNum = 1;
    let nextStage = false;
    debug.profilebegin("generate_obbyparts");
    for (let i = 0; i < 100; i++) {
        const part = createRandomObbyPart();
        if (part !== undefined) {
            part.AttachTo(lastObbyPart);

            if (nextStage) {
                stageNum++;
                stageStarts.set(stageNum, part);
                nextStage = false;
            }

            if (part.Configuration.CountAsNewStage) {
                nextStage = true;
            }

            part.StageNumber = stageNum;
            print(`${part.GUID} = ${part.StageNumber}`);

            part.OnPlayerPassesStart.bind((ply) => {
                const stat = getLeaderstatsForPlayer(ply);
                stat.setStatValue("Stage", part.StageNumber);

                if (stageStarts.get(part.StageNumber) === part) {
                    print("set spawn");
                    const spawnCFrame = part.StartPart.CFrame.add(new Vector3(0, 3, 0));
                    SpawnManager.setSpawnLocation(ply, spawnCFrame);
                }
            });

            stages[i] = part;
            lastObbyPart = part;
        }
    }
    debug.profileend();
}
