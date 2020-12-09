import Roact from "@rbxts/roact";
import { Players } from "@rbxts/services";
import UI from "./ui";

const uiMountHandle = Roact.mount(UI, Players.LocalPlayer!.FindFirstChildOfClass("PlayerGui"));
