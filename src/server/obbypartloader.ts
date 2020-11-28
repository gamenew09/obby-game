import Cue from "@rbxts/cue";
import { HttpService, Players, ServerStorage, Workspace } from "@rbxts/services";
import t from "@rbxts/t";
import { InstanceAs } from "shared/ensureutil";

export interface ObbyPartConfig {
    [key: string]: unknown;
    Difficulty: number;
    Beginning: boolean;
    CountAsNewStage: boolean;
}

export interface ObbyPartInfo {
    readonly PartName: string;
    readonly Configuration: ObbyPartConfig;
}

function parseConfigurationFolder(configFolder: Configuration): ObbyPartConfig {
    const config: { [key: string]: unknown } | ObbyPartConfig = {
        Beginning: false,
        CountAsNewStage: true,
    };
    for (const valObject of configFolder.GetChildren()) {
        if (valObject.IsA("ValueBase")) {
            switch (valObject.Name) {
                case "Difficulty":
                    assert(valObject.IsA("IntValue"), "Difficulty must be an integer value.");
                    config.Difficulty = valObject.Value;
                    break;
                case "Beginning":
                    assert(valObject.IsA("BoolValue"), "Beginning must be an bool value.");
                    config.Beginning = valObject.Value;
                    break;
                case "CountAsNewStage":
                    assert(valObject.IsA("BoolValue"), "CountAsNewStage must be an bool value.");
                    config.CountAsNewStage = valObject.Value;
                    break;
                default:
                    config[valObject.Name] = valObject.Value;
                    break;
            }
        }
    }

    return config as ObbyPartConfig;
}

const DEBUG_PART_LOADER = true;

export class ObbyPart implements ObbyPartInfo {
    public readonly GUID: string;

    public readonly PartName: string;
    public readonly Model: Model;

    public readonly StartPart: BasePart;
    public readonly EndPart: BasePart;

    public readonly Configuration: ObbyPartConfig;

    public readonly OnPlayerPassesStart: Cue<(ply: Player) => void> = new Cue<(ply: Player) => void>();

    public StageNumber: number;

    private passedPartMap: Map<Player, true> = new Map<Player, true>();

    public constructor(model: Model) {
        this.PartName = model.Name;
        this.Model = model;
        this.StageNumber = 0;

        this.GUID = HttpService.GenerateGUID(false);
        model.Name = this.GUID;

        const configObject = model.FindFirstChildOfClass("Configuration");
        let config: ObbyPartConfig = {
            Difficulty: 0,
            Beginning: false,
            CountAsNewStage: true,
        };

        if (configObject !== undefined) {
            config = parseConfigurationFolder(configObject);
        }
        this.Configuration = config;

        const startPart = this.Model.FindFirstChild("Start");
        if (startPart?.IsA("BasePart")) {
            this.Model.PrimaryPart = startPart;
            this.StartPart = startPart;
        } else {
            error(`${this.PartName} has no valid start part.`);
        }

        const endPart = this.Model.FindFirstChild("End");
        if (endPart?.IsA("BasePart")) {
            this.EndPart = endPart;
        } else {
            error(`${this.PartName} has no valid end part.`);
        }

        if (!DEBUG_PART_LOADER) {
            if (!config.Beginning) {
                this.StartPart.Transparency = 1;
            }
            this.EndPart.Transparency = 1;
        }

        this.StartPart.Touched.Connect((otherPart) => {
            if (otherPart.Parent === undefined) return;

            const ply = Players.GetPlayerFromCharacter(otherPart.Parent);
            if (ply !== undefined && !this.passedPartMap.has(ply)) {
                this.OnPlayerPassesStart.go(ply);
                this.passedPartMap.set(ply, true);
            }
        });

        this.modifyObbyPartInstances(model.GetChildren().filter((inst) => inst.IsA("BasePart")) as BasePart[]);
    }

    protected modifyObbyPartInstances(parts: BasePart[]) {
        if (!this.Configuration.Beginning) {
            parts.forEach((part) => {
                part.BrickColor = BrickColor.random();
            });
        }
    }

    public AttachTo(other: ObbyPart | undefined) {
        if (other === undefined) {
            this.Model.SetPrimaryPartCFrame(new CFrame());
            return;
        }

        assert(other.EndPart, "other.EndPart is undefined.");
        const newCFrame = other.EndPart.CFrame;
        this.Model.SetPrimaryPartCFrame(newCFrame);
    }
}

const ObbyParts = ServerStorage.WaitForChild("ObbyParts");

const obbyInfoCache: Map<string, ObbyPartInfo> = new Map<string, ObbyPartInfo>();

export function createObbyPart(name: string): ObbyPart | undefined {
    const obbyPartModel = ObbyParts.FindFirstChild(name);
    if (obbyPartModel === undefined) return undefined;

    const modelClone = InstanceAs(obbyPartModel.Clone(), "Model");
    modelClone.Parent = Workspace;

    return new ObbyPart(modelClone);
}

export function getObbyInfo(name: string): ObbyPartInfo | undefined {
    if (obbyInfoCache.has(name)) return obbyInfoCache.get(name);

    const obbyPartModel = ObbyParts.FindFirstChild(name);
    if (obbyPartModel === undefined) return undefined;

    const configObject = obbyPartModel.FindFirstChildOfClass("Configuration");
    let config: ObbyPartConfig = {
        Difficulty: 0,
        Beginning: false,
        CountAsNewStage: true,
    };

    if (configObject !== undefined) {
        config = parseConfigurationFolder(configObject);
    }

    return {
        PartName: name,
        Configuration: config,
    };
}

export function getLoadableObbyPartNames(): string[] {
    const loadables: string[] = [];
    for (const obbyPartModel of ObbyParts.GetChildren()) {
        const info = getObbyInfo(obbyPartModel.Name);
        if (info !== undefined && !info.Configuration.Beginning) {
            loadables.push(info.PartName);
        }
    }
    return loadables;
}

const obbyPartNames = getLoadableObbyPartNames();

export function createRandomObbyPart(): ObbyPart | undefined {
    const name = obbyPartNames[math.random(0, obbyPartNames.size() - 1)];
    return createObbyPart(name);
}
