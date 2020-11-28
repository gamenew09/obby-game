import { Players, RunService } from "@rbxts/services";

class SpawnManager {
    private playerAddedConnections: RBXScriptConnection;

    private spawnMap: Map<Player, CFrame> = new Map<Player, CFrame>();

    public AutomaticRespawn = true;

    constructor() {
        this.playerAddedConnections = Players.PlayerAdded.Connect((ply) => this.onPlayerAdded(ply));
    }

    public setSpawnLocation(ply: Player, location: CFrame) {
        this.spawnMap.set(ply, location);
    }

    public getSpawnLocation(ply: Player) {
        return this.spawnMap.get(ply) ?? new CFrame();
    }

    public spawnPlayer(ply: Player) {
        ply.LoadCharacter();
    }
    public spawnPlayerAt(ply: Player, location: CFrame) {
        this.setSpawnLocation(ply, location);
        this.spawnPlayer(ply);
    }

    protected onPlayerAdded(ply: Player) {
        ply.CharacterAdded.Connect((char) => this.onCharacterAdded(ply, char));
    }

    protected onCharacterAdded(ply: Player, char: Model) {
        RunService.Heartbeat.Wait();
        char.SetPrimaryPartCFrame(this.getSpawnLocation(ply));

        if (this.AutomaticRespawn) {
            char.FindFirstChildOfClass("Humanoid")?.Died.Connect(() => {
                wait(2);
                this.spawnPlayer(ply);
            });
        }
    }
}

export default new SpawnManager();
