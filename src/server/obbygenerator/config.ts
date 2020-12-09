/**
 * A type that indicates a difficulty number used in ObbyGeneratorDifficulty.DifficultyNumber.
 */
export type DifficultyIndex = string;

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
    IncludeDifficulties?: string[];
}

export interface ObbyGeneratorSettings<M> {
    /**
     * Indicates whether or not the generator should show debug data.
     */
    Debug?: boolean;
    /**
     * If a difficulty is not defined, then these settings will be used. (if not specified, the first difficulty setting defined the array will be used)
     * (There will also be a warning printed into the console)
     */
    DefaultSettings?: ObbyGeneratorDifficultySettings;
    Difficulties: M;

    /**
     * If provided, only these difficulties will be generated.
     */
    GenerateDifficulties?: DifficultyIndex[];
}

const obbyGeneratorConfig: ObbyGeneratorSettings<{ [difficultyName: string]: ObbyGeneratorDifficultySettings }> = {
    Difficulties: {
        BasicJumps: {
            MinimumStageCount: 2,
            MaximumStageCount: 5,
            StageSettings: {
                MinimumPartCount: 1,
                MaximumPartCount: 5,
            },
        },
        JumpsAndLava: {
            MinimumStageCount: 5,
            MaximumStageCount: 10,
            StageSettings: {
                MinimumPartCount: 3,
                MaximumPartCount: 10,
            },
            IncludeDifficulties: ["BasicJumps"],
        },
    },

    GenerateDifficulties: ["JumpsAndLava"],
};

export default (obbyGeneratorConfig as unknown) as ObbyGeneratorSettings<Map<string, ObbyGeneratorDifficultySettings>>;
