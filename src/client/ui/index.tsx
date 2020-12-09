import Roact from "@rbxts/roact";
import { StoreProvider } from "@rbxts/roact-rodux";
import MainStore from "client/rodux";
import UI from "./ui";

export default (
    <StoreProvider store={MainStore}>
        <screengui Key={"MainUI"} ResetOnSpawn={false} IgnoreGuiInset={false}>
            <UI />
        </screengui>
    </StoreProvider>
);
