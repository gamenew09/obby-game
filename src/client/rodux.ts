import Rodux from "@rbxts/rodux";
import { Players } from "@rbxts/services";
import { InstanceAs } from "shared/ensureutil";
import { copyInterface } from "shared/tableutil";
import localLeaderstats, { ObbyLeaderstatsInterface } from "./leaderstats";

export type PlayerState = "Alive" | "Dead";

export interface PlayerData {
    Health: number;
    State: PlayerState;
}

export interface GameStoreState {
    LocalLeaderstats: ObbyLeaderstatsInterface;
    PlayerData: PlayerData;
}

export type PartialGameStoreState = Partial<GameStoreState>;

// Actions

const LOCAL_LEADERSTATS_UPDATE = "LocalLeaderstatsUpdate";
const PLAYER_STATE_UPDATE = "PlayerStateUpdate";
const PLAYER_HEALTH_UPDATE = "PlayerHealthUpdate";

type LocalLeaderstatsUpdate = Rodux.Action<typeof LOCAL_LEADERSTATS_UPDATE> & Partial<ObbyLeaderstatsInterface>;

interface PlayerStateUpdate extends Rodux.Action<typeof PLAYER_STATE_UPDATE> {
    NewPlayerState: PlayerState;
}

interface PlayerHealthUpdate extends Rodux.Action<typeof PLAYER_HEALTH_UPDATE> {
    NewHealth: number;
}

export type GameStoreActions = LocalLeaderstatsUpdate | PlayerStateUpdate | PlayerHealthUpdate;

//

function identityReducer<S, A>(state: S, action: A): S {
    return state;
}

const localLeaderStatsReducer = Rodux.createReducer<ObbyLeaderstatsInterface, GameStoreActions>(
    { Stage: 0 },
    {
        LocalLeaderstatsUpdate: (state, action) => {
            const newState = copyInterface(state);
            for (const [name, val] of (newState as unknown) as Map<keyof typeof state, unknown>) {
                if (action[name] !== undefined) {
                    newState[name] = (action as LocalLeaderstatsUpdate)[name]!;
                }
            }
            return newState;
        },
        PlayerStateUpdate: identityReducer,
        PlayerHealthUpdate: identityReducer,
    },
);

const playerDataReducer = Rodux.createReducer<PlayerData, GameStoreActions>(
    {
        Health: 0,
        State: "Dead",
    },
    {
        LocalLeaderstatsUpdate: identityReducer,
        PlayerStateUpdate: (state, action) => {
            const newState = copyInterface(state);
            newState.State = action.NewPlayerState;
            return newState;
        },
        PlayerHealthUpdate: (state, action) => {
            const newState = copyInterface(state);
            newState.Health = action.NewHealth;
            return newState;
        },
    },
);

const reducers = Rodux.combineReducers<GameStoreState, GameStoreActions>({
    LocalLeaderstats: localLeaderStatsReducer,
    PlayerData: playerDataReducer,
});

const MainStore = new Rodux.Store<GameStoreState, GameStoreActions, {}>(reducers, undefined, [Rodux.loggerMiddleware]);

localLeaderstats.onStatChanged.bind((stateName, newValue) => {
    const leaderstatUpdate: LocalLeaderstatsUpdate = {
        type: LOCAL_LEADERSTATS_UPDATE,
    };
    assert(
        localLeaderstats.isValidValueForStat(stateName, newValue),
        "Value recieved in stat changed is invalid. This should NEVER happen.",
    );
    leaderstatUpdate[stateName] = newValue as ObbyLeaderstatsInterface[typeof stateName];
    MainStore.dispatch(leaderstatUpdate);
});

MainStore.dispatch({
    type: "LocalLeaderstatsUpdate",
    Stage: localLeaderstats.getStatNumberValue("Stage"),
});

function onCharacterAdded(character: Model) {
    MainStore.dispatch({
        type: "PlayerStateUpdate",
        NewPlayerState: "Alive",
    });

    const humanoid = character.WaitForChild("Humanoid") as Humanoid;
    assert(humanoid !== undefined, "character does not have Humanoid");
    const health = humanoid !== undefined ? humanoid.Health : 0;

    humanoid.Died.Connect(() => {
        MainStore.dispatch({
            type: "PlayerStateUpdate",
            NewPlayerState: "Dead",
        });
    });

    humanoid.HealthChanged.Connect((health) => {
        MainStore.dispatch({
            type: "PlayerHealthUpdate",
            NewHealth: health,
        });
    });

    MainStore.dispatch({
        type: "PlayerHealthUpdate",
        NewHealth: health,
    });
}

const character = Players.LocalPlayer!.Character;

if (character !== undefined) {
    onCharacterAdded(InstanceAs(character, "Model"));
} else {
    MainStore.dispatch({
        type: "PlayerStateUpdate",
        NewPlayerState: "Dead",
    });
}

Players.LocalPlayer!.CharacterAdded.Connect(onCharacterAdded);

export default MainStore;
