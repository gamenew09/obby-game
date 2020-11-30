export type LeaderstatType = "number" | "string";

interface LeaderstatStat {
    Name: string;
    Type: LeaderstatType;
    Object: ValueBase;
}

type LeaderstatsKey<T> = Exclude<keyof T, number | Symbol>;
export class Leaderstats<T> {
    private leaderstats: ObjectValue;

    private stats: Map<string, LeaderstatStat> = new Map<string, LeaderstatStat>();

    constructor(ply: Player) {
        this.leaderstats = new Instance("ObjectValue");
        this.leaderstats.Name = "leaderstats";
        this.leaderstats.Parent = ply;

        print(this.leaderstats);
    }

    public addStat(name: LeaderstatsKey<T>, statType: LeaderstatType, defaultValue?: string | number): Leaderstats<T> {
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

    public deleteStat(name: LeaderstatsKey<T>) {
        if (this.stats.has(name)) {
            this.stats.get(name)!.Object.Destroy();
        }
        this.stats.delete(name);
    }

    public setStatValue<N extends LeaderstatsKey<T>>(name: N, val: T[N]) {
        const stat = this.stats.get(name);
        if (stat !== undefined) {
            stat.Object.Value = val;
        }
    }

    public getStatNumberValue(name: LeaderstatsKey<T>): number | undefined {
        const stat = this.stats.get(name);
        if (stat !== undefined && stat.Type === "number") {
            return stat.Object.Value as number;
        } else {
            return undefined;
        }
    }

    public getStatStringValue(name: LeaderstatsKey<T>): string | undefined {
        const stat = this.stats.get(name);
        if (stat !== undefined && stat.Type === "string") {
            return stat.Object.Value as string;
        } else {
            return undefined;
        }
    }

    public getStatValue<N extends LeaderstatsKey<T>>(name: N): T[N] | undefined {
        const stat = this.stats.get(name);
        if (stat !== undefined) {
            return stat.Object.Value as T[N];
        } else {
            return undefined;
        }
    }

    public addStatValue<N extends LeaderstatsKey<T>, D extends T[N] extends number ? T[N] : never>(name: N, delta: D) {
        this.setStatValue(name, ((((this.getStatValue(name) as unknown) as number) + delta) as unknown) as T[N]);
    }
}

interface ObbyLeaderstatsInterface {
    Stage: number;
}

type MainLeaderstats = Leaderstats<ObbyLeaderstatsInterface>;

const leaderstatsCache: Map<Player, MainLeaderstats> = new Map<Player, MainLeaderstats>();
export function getLeaderstatsForPlayer(ply: Player): MainLeaderstats {
    if (leaderstatsCache.has(ply)) return leaderstatsCache.get(ply)!;

    const leaderstats = new Leaderstats<ObbyLeaderstatsInterface>(ply);

    leaderstatsCache.set(ply, leaderstats);
    return leaderstats;
}
