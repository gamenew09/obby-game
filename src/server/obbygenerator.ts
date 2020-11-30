import { RunService } from "@rbxts/services";
import { pickRandomElementFromArray } from "shared/randomutil";
import { getLeaderstatsForPlayer } from "./leaderstats";
import { createObbyPart, getAllLoadableObbyPartInfos, ObbyPart } from "./obbypartloader";

/**
 * A type that indicates a difficulty number used in ObbyGeneratorDifficulty.DifficultyNumber.
 */
export type DifficultyNumber = number;

export interface ObbyGeneratorStageSettings {
    /**
     * How many obby parts should there with a stage before considering creating a new stage.
     */
    MinimumPartCount: number;

    /**
     * How many obby parts can there be to a single stage.
     */
    MaximumPartCount?: number;
}

export interface ObbyGeneratorDifficultySettings {
    /**
     * The difficulty number that is being configured.
     */
    DifficultyNumber: DifficultyNumber;

    /**
     * How many stages should a difficulty have before considering adding another difficulty.
     */
    MinimumStageCount: number;
    /**
     * How many stages can a difficulty have before being forced to move to the next difficulty.
     */
    MaximumStageCount?: number;

    /**
     * The settings that a stage confides to in a specific difficulty.
     */
    StageSettings: ObbyGeneratorStageSettings;

    /**
     * What other difficulties should the generator include alongside this difficulty
     */
    IncludeDifficulties?: DifficultyNumber[];
}

export interface ObbyGeneratorSettings {
    /**
     * Indicates whether or not the generator should show debug data.
     */
    Debug?: boolean;
    /**
     * If a difficulty is not defined, then these settings will be used. (if not specified, the first difficulty setting defined the array will be used)
     * (There will also be a warning printed into the console)
     */
    DefaultSettings?: ObbyGeneratorDifficultySettings;
    Difficulties: ObbyGeneratorDifficultySettings[];
}

const obbyGeneratorConfig: ObbyGeneratorSettings = {
    Difficulties: [
        {
            DifficultyNumber: 0,
            MinimumStageCount: 2,
            MaximumStageCount: 5,
            StageSettings: {
                MinimumPartCount: 1,
                MaximumPartCount: 5,
            },
        },
    ],
};

function getDifficultyGenerationSettings(difficultyNum: number): ObbyGeneratorDifficultySettings {
    const settingsSet = obbyGeneratorConfig.Difficulties.filter((diff) => diff.DifficultyNumber === difficultyNum);
    if (settingsSet.size() <= 0) return obbyGeneratorConfig.DefaultSettings ?? obbyGeneratorConfig.Difficulties[0];
    return settingsSet[0] ?? obbyGeneratorConfig.DefaultSettings ?? obbyGeneratorConfig.Difficulties[0];
}

export type ObbyDifficultyMap = Map<DifficultyNumber, ObbyPart[]>;

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
    const map: ObbyDifficultyMap = new Map<DifficultyNumber, ObbyPart[]>();

    const data: GeneratingData = {
        CurStageNumber: 1,
        ConnectingPieces: 0,
        DifficultPieces: 0,
        TotalPieces: 0,
    };

    let stageOffset = 0;

    let previousPart: ObbyPart | undefined = startPart;
    for (const difficulty of obbyGeneratorConfig.Difficulties) {
        const parts: ObbyPart[] = [];

        const allDifficulties = new Map<DifficultyNumber, true>();
        allDifficulties.set(difficulty.DifficultyNumber, true);
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

            obbyPart.AttachTo(previousPart);
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

        print(`Generated ${difficulty.DifficultyNumber} with ${data.CurStageNumber} stages.`);
        map.set(difficulty.DifficultyNumber, parts);
    }

    return map;
}
