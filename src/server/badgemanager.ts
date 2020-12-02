import { BadgeService } from "@rbxts/services";
import PlaceData, { BadgeIDsList } from "shared/placedependentdata";

/**
 * Converts a badge name as defined in shared/placedependentdata.ts@BadgeIDsList to a valid badge id for use with BadgeService functions.
 * @param badgeName The badge to lookup.
 */
export function getBadgeIDFromName<T extends keyof BadgeIDsList>(badgeName: T): number {
    const badgeId: number = PlaceData.BadgeLookup[badgeName];
    assert(
        typeIs(badgeId, "number"),
        `Resolved badge ID from ${badgeName} was not a number, instead was ${typeOf(badgeId)}!`,
    );
    return badgeId;
}

/**
 * Awards a specific badge to a player.
 * @param ply The player to award the badge to.
 * @param badgeName The name of the badge in question, as defined in shared/placedependentdata.ts@BadgeIDsList.
 */
export async function awardBadge<T extends keyof BadgeIDsList>(ply: Player, badgeName: T): Promise<void> {
    const badgeId = getBadgeIDFromName(badgeName);

    assert(
        (await getBadgeInfo(badgeName)).IsEnabled,
        `${badgeName} must be enabled on the Roblox website to be awarded`,
    );
    BadgeService.AwardBadge(ply.UserId, badgeId);
}

/**
 * Returns info about the given badge from the Roblox website.
 * @see BadgeInfo
 * @param badgeName The name of the badge in question, as defined in shared/placedependentdata.ts@BadgeIDsList.
 */
export async function getBadgeInfo<T extends keyof BadgeIDsList>(badgeName: T): Promise<BadgeInfo> {
    const badgeId = getBadgeIDFromName(badgeName);
    return BadgeService.GetBadgeInfoAsync(badgeId);
}

/**
 * Returns a boolean determining if a player has the specific badge in question.
 * @param ply The player to lookup badge awarded status for.
 * @param badgeName The name of the badge in question, as defined in shared/placedependentdata.ts@BadgeIDsList.
 */
export async function playerHasBadge<T extends keyof BadgeIDsList>(ply: Player, badgeName: T): Promise<boolean> {
    return await userHasBadge(ply.UserId, badgeName);
}

/**
 * Returns a boolean determining if a user Id has the specific badge in question.
 * @param userId The user id to lookup badge awarded status for.
 * @param badgeName The name of the badge in question, as defined in shared/placedependentdata.ts@BadgeIDsList.
 */
export async function userHasBadge<T extends keyof BadgeIDsList>(userId: number, badgeName: T): Promise<boolean> {
    const badgeId = getBadgeIDFromName(badgeName);
    return BadgeService.UserHasBadgeAsync(userId, badgeId);
}
