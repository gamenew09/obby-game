# ObbyGame
> This Roblox game was an exercise for me to learn how to use [roblox-ts](https://roblox-ts.com) and get back into the rhythm making a Roblox game again. This game isn't going to be AAA quality but I think it'll be a decent game.

This game generates a random obby for players to complete. This game is designed to be able to be built and published without having to go into the place-file and edit anything.

## Auto Deployment
This repository has a simple workflow that will use GitHub Actions to automatically deploy to a place!
All you need to do is add the following [secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets) to your repository:
    - `DEPLOYER_ROBLOSECURITY`: the .ROBLOSECURITY token of the deployer account.
    - `PLACE_ID`: the Place ID (i.e. the `6026623952` in `https://www.roblox.com/games/6026623952/Obby-Game`) in question that you want to upload to. 

## Playing the game
You can either [click here](https://www.roblox.com/games/6026623952/Obby-Game) to play the game or if you want to build it locally you can run `rojo build` (as long as you have [Rojo](https://rojo.space/) installed).

Eventually I do want to have this place just auto-build and publish whenever I create a release on the GitHub page, but right now I'm just gonna focus on making the game for a bit.