export type LeaderstatType = "number" | "string";

interface LeaderstatStat {
    Name: string;
    Type: LeaderstatType;
    Object: ValueBase;
}

export class Leaderstats {
    private leaderstats: ObjectValue;

    private stats: Map<string, LeaderstatStat> = new Map<string, LeaderstatStat>();

    constructor(ply: Player) {
        this.leaderstats = new Instance("ObjectValue");
        this.leaderstats.Name = "leaderstats";
        this.leaderstats.Parent = ply;

        print(this.leaderstats);
    }

    public addStat(name: string, statType: LeaderstatType, defaultValue?: string | number): Leaderstats {
        let obj: ValueBase;
        switch (statType) {
            case "number":
                obj = new Instance("NumberValue");
                obj.Name = name;
                print(typeIs(defaultValue, "number"));
                if (typeIs(defaultValue, "number")) {
                    obj.Value = defaultValue;
                }
                break;
            case "string":
                obj = new Instance("StringValue");
                obj.Name = name;
                if (typeIs(defaultValue, "string")) {
                    obj.Value = defaultValue;
                }
                break;
            default:
                error("Invalid stat type.");
        }

        obj.Parent = this.leaderstats;

        this.stats.set(name, {
            Name: name,
            Type: statType,
            Object: obj,
        });
        return this;
    }

    public deleteStat(name: string) {
        if (this.stats.has(name)) {
            this.stats.get(name)!.Object.Destroy();
        }
        this.stats.delete(name);
    }

    public setStatValue(name: string, val: string | number) {
        const stat = this.stats.get(name);
        if (stat !== undefined) {
            stat.Object.Value = val;
        }
    }

    public getStatNumberValue(name: string): number | undefined {
        const stat = this.stats.get(name);
        if (stat !== undefined && stat.Type === "number") {
            return stat.Object.Value as number;
        } else {
            return undefined;
        }
    }

    public getStatStringValue(name: string): string | undefined {
        const stat = this.stats.get(name);
        if (stat !== undefined && stat.Type === "string") {
            return stat.Object.Value as string;
        } else {
            return undefined;
        }
    }
}

const leaderstatsCache: Map<Player, Leaderstats> = new Map<Player, Leaderstats>();
export function getLeaderstatsForPlayer(ply: Player): Leaderstats {
    if (leaderstatsCache.has(ply)) return leaderstatsCache.get(ply)!;

    const leaderstats = new Leaderstats(ply);

    leaderstatsCache.set(ply, leaderstats);
    return leaderstats;
}
