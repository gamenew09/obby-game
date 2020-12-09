import { RunService } from "@rbxts/services";
import { pickRandomElementFromArray } from "shared/randomutil";
import { arrayHas } from "shared/tableutil";
import { getLeaderstatsForPlayer } from "../leaderstats";
import { createObbyPart, getAllLoadableObbyPartInfos, ObbyPart } from "../obbypartloader";
import obbyGeneratorConfig, { DifficultyIndex, ObbyGeneratorDifficultySettings } from "./config";

function getDifficultyGenerationSettings(difficultyName: string): ObbyGeneratorDifficultySettings {
    return obbyGeneratorConfig.Difficulties.get(difficultyName) ?? obbyGeneratorConfig.DefaultSettings!;
}

export type ObbyDifficultyMap = Map<DifficultyIndex, ObbyPart[]>;

interface GeneratingData {
    CurStageNumber: number;
    DifficultPieces: number;
    ConnectingPieces: number;
    TotalPieces: number;
}

type GenerateAction = "Continue" | "NewStage" | "Done";

function getNextGeneratingAction(
    data: GeneratingData,
    difficultyData: ObbyGeneratorDifficultySettings,
): GenerateAction {
    const maxStageCount = difficultyData.MaximumStageCount ?? math.random(5, 100);
    if (data.CurStageNumber > maxStageCount && data.CurStageNumber >= difficultyData.MinimumStageCount) {
        // We have either the exact or over the amount of stages wanted.
        return "Done";
    }

    const stageSettings = difficultyData.StageSettings;

    const maxPartCount = stageSettings.MaximumPartCount ?? math.random(5, 100);
    if (data.TotalPieces > maxPartCount && data.TotalPieces >= stageSettings.MinimumPartCount) {
        return "NewStage";
    }

    return "Continue";
}

export async function generateObby(startPart?: ObbyPart): Promise<ObbyDifficultyMap> {
    const map: ObbyDifficultyMap = new Map<DifficultyIndex, ObbyPart[]>();

    const data: GeneratingData = {
        CurStageNumber: 1,
        ConnectingPieces: 0,
        DifficultPieces: 0,
        TotalPieces: 0,
    };

    let stageOffset = 0;

    let previousPart: ObbyPart | undefined = startPart;
    for (const [difficultyName, difficulty] of obbyGeneratorConfig.Difficulties) {
        if (
            obbyGeneratorConfig.GenerateDifficulties !== undefined &&
            !arrayHas(obbyGeneratorConfig.GenerateDifficulties, difficultyName)
        ) {
            continue;
        }

        const parts: ObbyPart[] = [];

        const allDifficulties = new Map<DifficultyIndex, true>();
        allDifficulties.set(difficultyName, true);
        if (difficulty.IncludeDifficulties !== undefined) {
            for (const diffNum of difficulty.IncludeDifficulties) {
                allDifficulties.set(diffNum, true);
            }
        }

        let nextAction: GenerateAction = "Continue";
        while ((nextAction = getNextGeneratingAction(data, difficulty)) !== "Done") {
            const isNewStage = nextAction === "NewStage";

            let obbyPart: ObbyPart;

            if (isNewStage) {
                data.CurStageNumber++;

                data.DifficultPieces = 0;
                data.ConnectingPieces = 0;
                data.TotalPieces = 0;

                obbyPart = createObbyPart(
                    pickRandomElementFromArray(
                        getAllLoadableObbyPartInfos().filter((info) => info.Configuration.StageSeperator),
                    ).PartName,
                )!;
                assert(obbyPart);

                const stageNum = data.CurStageNumber;
                obbyPart.OnPlayerPassesStageChange.bind((ply) => {
                    getLeaderstatsForPlayer(ply).setStatValue("Stage", stageNum);
                });
            } else {
                const info = pickRandomElementFromArray(
                    getAllLoadableObbyPartInfos().filter(
                        (info) =>
                            allDifficulties.has(info.Configuration.Difficulty) && !info.Configuration.StageSeperator,
                    ),
                );
                obbyPart = createObbyPart(info.PartName)!;
                assert(obbyPart);
            }

            obbyPart.StageNumber = data.CurStageNumber;
            obbyPart.AttachTo(previousPart);

            obbyPart.RunScripts();

            parts.push(obbyPart);

            previousPart = obbyPart;

            if (obbyPart.Configuration.ConnectorPiece) {
                data.ConnectingPieces++;
            } else {
                data.DifficultPieces++;
            }

            data.TotalPieces++;
            RunService.Heartbeat.Wait();
        }

        stageOffset += data.CurStageNumber;

        print(`Generated ${difficultyName} with ${data.CurStageNumber} stages.`);
        map.set(difficultyName, parts);
    }

    return map;
}
