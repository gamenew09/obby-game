import Cue from "@rbxts/cue";
import { HttpService, Players, ServerStorage, Workspace } from "@rbxts/services";
import t from "@rbxts/t";
import { printOutInterface } from "shared/debugutil";
import { InstanceAs } from "shared/ensureutil";
import { copyInterface } from "shared/tableutil";

export interface ObbyPartConfig {
    /**
     * Indicates the difficulty of a obby part, which is used when generating an obby stage.
     */
    Difficulty: string;
    /**
     * Indicates that the obby piece is the beginning platform that a player is on.
     */
    Beginning: boolean;
    /**
     * Indicates whether or not a part is considered a "connector" piece.
     *
     * In generation, this will indicate that there is not a challenging obby piece and the generator should make sure that it has at least one "challenging" piece before considering a new stage.
     */
    ConnectorPiece: boolean;
    /**
     * Is this piece considered the seperator between two stages?
     */
    StageSeperator: boolean;
}
type ObbyPartConfigGeneric = ObbyPartConfig & { [key: string]: unknown };

type ObbyPartConfigNames = Exclude<keyof ObbyPartConfig, number | Symbol>;

export interface ObbyPartInfo {
    readonly PartName: string;
    readonly Configuration: ObbyPartConfigGeneric;
}

const defaultSettings: ObbyPartConfig = {
    Beginning: false,
    ConnectorPiece: false,
    Difficulty: "",
    StageSeperator: false,
};

function parseConfigurationFolder(configFolder: Configuration): ObbyPartConfigGeneric {
    const config: ObbyPartConfigGeneric = copyInterface((defaultSettings as unknown) as ObbyPartConfigGeneric);

    for (const valObject of configFolder.GetChildren()) {
        if (valObject.IsA("ValueBase")) {
            switch (valObject.Name as ObbyPartConfigNames) {
                case "Difficulty":
                    assert(
                        valObject.IsA("StringValue"),
                        `${valObject.Name} must be a string value. It is ${valObject.ClassName}`,
                    );
                    break;
                case "Beginning":
                case "ConnectorPiece":
                case "StageSeperator":
                    assert(valObject.IsA("BoolValue"), `${valObject.Name} must be an bool value.`);
                    break;
            }
            config[valObject.Name] = valObject.Value;
        }
    }

    return config as ObbyPartConfigGeneric;
}

const DEBUG_PART_LOADER = false;

export class ObbyPart implements ObbyPartInfo {
    public readonly GUID: string;

    public readonly PartName: string;
    public readonly Model: Model;

    public readonly StartPart: BasePart;
    public readonly EndPart: BasePart;

    public readonly Configuration: ObbyPartConfigGeneric;

    public readonly OnPlayerPassesStageChange: Cue<(ply: Player) => void> = new Cue<(ply: Player) => void>();

    public StageNumber: number;

    private passedPartMap: Map<Player, true> = new Map<Player, true>();

    public constructor(model: Model) {
        this.PartName = model.Name;
        this.Model = model;
        this.DisableScripts();
        this.StageNumber = 0;

        this.GUID = HttpService.GenerateGUID(false);
        model.Name = this.GUID;

        const configObject = model.FindFirstChildOfClass("Configuration");
        let config: ObbyPartConfigGeneric = copyInterface((defaultSettings as unknown) as ObbyPartConfigGeneric);

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
    }

    /**
     * Disables all scripts found within the obby part's model.
     */
    public DisableScripts(): void {
        (this.Model.GetDescendants().filter((child) => child.IsA("BaseScript")) as BaseScript[]).forEach((script) => {
            script.Disabled = true;
        });
    }

    /**
     * Enables all scripts found within the obby part's model.
     */
    public EnableScripts(): void {
        (this.Model.GetDescendants().filter((child) => child.IsA("BaseScript")) as BaseScript[]).forEach((script) => {
            script.Disabled = false;
        });
    }

    protected IsDeathPart(part: BasePart): boolean {
        return part.Name.lower().sub(0, 4) === "kill";
    }

    public RunScripts(): void {
        this.EnableScripts();

        (this.Model.GetDescendants().filter(
            (child) => child.IsA("BasePart") && this.IsDeathPart(child),
        ) as BasePart[]).forEach((part) => {
            part.Touched.Connect((otherPart) => {
                const character = otherPart.Parent;
                if (character !== undefined) {
                    const humanoid = character.FindFirstChildOfClass("Humanoid");
                    if (humanoid !== undefined) {
                        humanoid.TakeDamage(1000);
                    }
                }
            });
        });
    }

    public toString(): string {
        return `ObbyPart[GUID=${this.GUID}, PartName=${this.PartName}]`;
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

const createdObbyParts: Map<string, ObbyPart> = new Map<string, ObbyPart>();

export function createObbyPart(name: string): ObbyPart | undefined {
    const obbyPartModel = ObbyParts.FindFirstChild(name);
    if (obbyPartModel === undefined) return undefined;

    const modelClone = InstanceAs(obbyPartModel.Clone(), "Model");

    const part = new ObbyPart(modelClone);
    createdObbyParts.set(part.GUID, part);

    modelClone.Parent = Workspace;

    return part;
}

export function getObbyPartByGUID(guid: string): ObbyPart | undefined {
    return createdObbyParts.get(guid);
}

function getcurrentobbypart_global(): ObbyPart | undefined {
    let cur = getfenv(0).script.Parent;
    while (cur !== undefined) {
        // Might be a valid GUID, check it.
        const part = getObbyPartByGUID(cur.Name);
        if (part !== undefined) {
            return part;
        }

        cur = cur.Parent;
    }
    return undefined;
}

(_G as { GetCurrentObbyPart: () => ObbyPart | undefined }).GetCurrentObbyPart = getcurrentobbypart_global;

export function getObbyInfo(name: string): ObbyPartInfo | undefined {
    if (obbyInfoCache.has(name)) return obbyInfoCache.get(name);

    const obbyPartModel = ObbyParts.FindFirstChild(name);
    if (obbyPartModel === undefined) return undefined;

    const configObject = obbyPartModel.FindFirstChildOfClass("Configuration");
    let config: ObbyPartConfigGeneric = copyInterface((defaultSettings as unknown) as ObbyPartConfigGeneric);

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

export function getAllLoadableObbyPartInfos(): ObbyPartInfo[] {
    const loadables: ObbyPartInfo[] = [];
    for (const obbyPartModel of ObbyParts.GetChildren()) {
        const info = getObbyInfo(obbyPartModel.Name);
        if (info !== undefined && !info.Configuration.Beginning) {
            loadables.push(info);
        }
    }
    return loadables;
}

export function createRandomObbyPart(): ObbyPart | undefined {
    const name = obbyPartNames[math.random(0, obbyPartNames.size() - 1)];
    return createObbyPart(name);
}
