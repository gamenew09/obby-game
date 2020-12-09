import Roact from "@rbxts/roact";
import RoactRodux from "@rbxts/roact-rodux";
import { TextService } from "@rbxts/services";
import localLeaderstats, { ObbyLeaderstatsInterface } from "client/leaderstats";
import MainStore, { GameStoreActions, GameStoreState } from "client/rodux";

interface StateProps {
    readonly LocalLeaderstats: GameStoreState["LocalLeaderstats"];
    readonly PlayerData: GameStoreState["PlayerData"];
}

interface DispatchProps {}

interface UIProps extends StateProps, DispatchProps {}

interface UIState {}

class UI extends Roact.Component<UIProps, UIState> {
    constructor(props: UIProps) {
        super(props);
    }

    render() {
        const stageText = `Stage: ${this.props.LocalLeaderstats.Stage}`;
        const font: CastsToEnum<Enum.Font> = Enum.Font.ArialBold;
        const fontSize = 50;
        const bounds = new Vector2(300, 50);
        const textSize = TextService.GetTextSize(stageText, fontSize, font, bounds);

        return (
            <textlabel
                Position={new UDim2(0, 0, 1, 0)}
                AnchorPoint={new Vector2(0, 1)}
                Size={new UDim2(0, textSize.X, 0, textSize.Y)}
                Key="StageNumber"
                Text={stageText}
                TextColor3={Color3.fromRGB(255, 255, 255)}
                TextStrokeColor3={Color3.fromRGB(0, 0, 0)}
                TextStrokeTransparency={0}
                BackgroundTransparency={1}
                Font={font}
                TextSize={fontSize}
            ></textlabel>
        );
    }
}

const mapState = (state: GameStoreState): StateProps => ({
    LocalLeaderstats: state.LocalLeaderstats,
    PlayerData: state.PlayerData,
});
const mapDispatch = (dispatch: Rodux.Dispatch<GameStoreActions>): DispatchProps => ({});

export default RoactRodux.connect(mapState, mapDispatch)(UI);
