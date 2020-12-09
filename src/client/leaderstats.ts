import Cue from "@rbxts/cue";
import { Players } from "@rbxts/services";
import { InstanceAs } from "shared/ensureutil";
import MainStore from "./rodux";

export type LeaderstatType = "number" | "string";

interface LeaderstatStat {
    Name: string;
    Type: LeaderstatType;
    Object: ValueBase;
}

type LeaderstatsKey<T> = Exclude<keyof T, number | Symbol>;
export class Leaderstats<T> {
    private leaderstats: Instance;

    private stats: Map<string, LeaderstatStat> = new Map<string, LeaderstatStat>();

    public readonly onStatChanged: Cue<(statName: LeaderstatsKey<T>, value: string | number) => void> = new Cue<
        (statName: LeaderstatsKey<T>, value: string | number) => void
    >();

    constructor(ply: Player, statNames: { Name: LeaderstatsKey<T>; Type: LeaderstatType }[]) {
        this.leaderstats = ply.WaitForChild("leaderstats");

        statNames.forEach((stat) => {
            const valueObject = InstanceAs(this.leaderstats.WaitForChild(stat.Name), "ValueBase");

            valueObject.Changed.Connect((newVal) => {
                if (typeIs(newVal, "number") || typeIs(newVal, "string")) {
                    this.onStatChanged.go(stat.Name, newVal);
                } else {
                    assert(false, "stat value is not number or a string.");
                }
            });

            this.stats.set(stat.Name, {
                Name: stat.Name,
                Type: stat.Type,
                Object: valueObject,
            });
        });
    }

    public isValidValueForStat(stat: LeaderstatsKey<T>, val: unknown): val is T[typeof stat] {
        const statData = this.stats.get(stat)!;
        assert(statData, `this.stats.get("${stat}") failed.`);
        return typeIs(val, statData.Type);
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
}

export interface ObbyLeaderstatsInterface {
    Stage: number;
}

const localLeaderstats = new Leaderstats<ObbyLeaderstatsInterface>(Players.LocalPlayer!, [
    {
        Name: "Stage",
        Type: "number",
    },
]);

export default localLeaderstats;
