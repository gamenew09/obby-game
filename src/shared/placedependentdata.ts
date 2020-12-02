export interface BadgeIDsList {}

export interface AssetIDsList {}

export interface PlaceDependentData {
    BadgeLookup: BadgeIDsList;
    AssetLookup: AssetIDsList;
}

const placeId = game.PlaceId;

const datas: Map<number, PlaceDependentData> = new Map<number, PlaceDependentData>();

datas.set(6026623952, {
    BadgeLookup: {},
    AssetLookup: {},
});

const data = datas.get(placeId)!;
assert(data !== undefined, `Place ID ${placeId} does not have a valid place dependent dataset, please set one!`);

export default data;
