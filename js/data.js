// Game component data for Age of Innovation, summarised from the rulebook appendices.

export const CATEGORIES = [
  { key: 'factions', label: 'Faction', plural: 'Factions' },
  { key: 'terrains', label: 'Terrain', plural: 'Terrains' },
  { key: 'palaces', label: 'Palace', plural: 'Palace tiles' },
  { key: 'bonuses', label: 'Round Bonus', plural: 'Round Bonus tiles' },
];

export const FACTIONS = [
  { id: 'blessed', name: 'Blessed', sprite: 11, text: 'Start: +1 Level in each Discipline. Phase III: Science Bonuses count their Level as 3 higher (also beyond 12).' },
  { id: 'felines', name: 'Felines', sprite: 4, text: 'Start: +1 Banking, +1 Medicine. When founding a City: advance 3 Levels in total and gain 1 Book of choice.' },
  { id: 'goblins', name: 'Goblins', sprite: 7, text: 'Start: +1 Banking, +1 Engineering, 1 Tool. Whenever they use a Spade: gain 2 Coins.' },
  { id: 'illusionists', name: 'Illusionists', sprite: 0, text: 'Start: +2 Medicine. Power actions cost 1 less power and give 3 points (4 in a 5-player game).' },
  { id: 'inventors', name: 'Inventors', sprite: 8, text: 'After placing first Workshops and choosing a Round Bonus tile, gain a Competency tile of choice.' },
  { id: 'lizards', name: 'Lizards', sprite: 9, text: 'Start: +2 Levels in 1 Discipline or +1 in 2. When founding a City: free Terraform and Build with 1 Spade plus a free Workshop.' },
  { id: 'moles', name: 'Moles', sprite: 5, text: 'Start: +2 Engineering. Tunneling: pay 1 Tool to skip a hex when building (4 points each). Action: pay 1 Tool to build a Bridge.' },
  { id: 'monks', name: 'Monks', sprite: 10, text: 'Start: +1 Law. Place only their University at setup (after all other placements) and gain its Competency tile.' },
  { id: 'navigators', name: 'Navigators', sprite: 1, text: 'Start: +3 Law. Whenever they build a Workshop next to a river space: 2 points.' },
  { id: 'omar', name: 'Omar', sprite: 6, text: 'Start: +1 Banking, +1 Engineering, plus a Neutral Tower (Power value 2) as a third starting building. Income: 2 power, 2 Coins.' },
  { id: 'philosophers', name: 'Philosophers', sprite: 2, text: 'Start: +2 Banking. Each Competency tile also gives 1 Book of the same Discipline. Action: gain 1 Book of choice.' },
  { id: 'psychics', name: 'Psychics', sprite: 3, text: 'Start: +1 Banking, +1 Medicine, 1 Tool. Action: gain 5 power, then immediately take a second action.' },
];

// Terrains correspond to the 7 Planning displays (and player colours).
export const TERRAINS = [
  { id: 'plains', name: 'Plains', sprite: 6, color: '#8a5a32', text: 'The Upgrade Terraforming action costs less.' },
  { id: 'swamp', name: 'Swamp', sprite: 2, color: '#2b2b2b', text: 'Start: gain 1 Scholar. Begin with 9 power in Bowl II and 3 in Bowl I.' },
  { id: 'lake', name: 'Lake', sprite: 4, color: '#2f6fc0', text: 'Start the game with Sailing value 1.' },
  { id: 'forest', name: 'Forest', sprite: 1, color: '#2f8a3c', text: 'Start: +1 Level in each Discipline. Begin with 8 power in Bowl II and 4 in Bowl I.' },
  { id: 'mountain', name: 'Mountain', sprite: 5, color: '#8c8c8c', text: 'Additional income of 2 Coins. Your first Guild gives 3 Coins income (instead of 2).' },
  { id: 'wasteland', name: 'Wasteland', sprite: 3, color: '#c0392b', text: 'Start: gain 1 Book of choice and 1 Tool. Your 2nd Innovation needs no additional Book.' },
  { id: 'desert', name: 'Desert', sprite: 0, color: '#e2b71f', text: 'Start: 1 free Spade after all starting buildings are placed.' },
];

// Palace #17 (red back) is not used in the draft variant, so it is not listed.
export const PALACES = [
  { id: 'p1', name: 'Palace 1', sprite: 0, text: 'Income: 5 power. Action: gain 2 Tools.' },
  { id: 'p2', name: 'Palace 2', sprite: 1, text: 'Action: Terraform and Build with 2 free Spades.' },
  { id: 'p3', name: 'Palace 3', sprite: 2, text: 'Income: 2 power. Action: downgrade a School to a Guild, gaining 3 points and 1 Tool.' },
  { id: 'p4', name: 'Palace 4', sprite: 3, text: 'Income: 2 power. Action: upgrade a Workshop to a Guild for free.' },
  { id: 'p5', name: 'Palace 5', sprite: 4, text: 'Income: 4 power. Immediately: 1 Competency tile of choice for free.' },
  { id: 'p6', name: 'Palace 6', sprite: 5, text: 'Income: 2 power, 1 Book. Action: advance up to 2 Levels in a single Discipline.' },
  { id: 'p7', name: 'Palace 7', sprite: 6, text: 'Income: 4 power. When you Pass: 3 points per School.' },
  { id: 'p8', name: 'Palace 8', sprite: 7, text: 'Income: 2 Coins, 2 power, 1 Tool. Found Cities with total Power value 6 (instead of 7).' },
  { id: 'p9', name: 'Palace 9', sprite: 8, text: 'Income: 1 Scholar. Flight: return 1 Scholar to fly over 1–2 hexes when you Terraform and Build; 5 points per Flight.' },
  { id: 'p10', name: 'Palace 10', sprite: 9, text: 'Income: 6 Coins. Immediately: 12 power and 2 Books of choice.' },
  { id: 'p11', name: 'Palace 11', sprite: 10, text: 'Income: 1 Tool. Immediately: 1 City tile of choice.' },
  { id: 'p12', name: 'Palace 12', sprite: 11, text: 'Income: 8 power. Whenever you build a Workshop: 2 points.' },
  { id: 'p13', name: 'Palace 13', sprite: 12, text: 'Action: gain 1 Book of choice and 3 Coins. Whenever you build a Guild: 3 points.' },
  { id: 'p14', name: 'Palace 14', sprite: 13, text: 'Income: 6 power. Immediately: 2 Sailing advances. When founding a City you may ignore 1 river hex.' },
  { id: 'p15', name: 'Palace 15', sprite: 14, text: 'Income: 6 power. Immediately: Terraform and Build with 2 free Spades, build 2 free Bridges, gain 2 Books.' },
  { id: 'p16', name: 'Palace 16', sprite: 15, text: 'Income: 2 power, 1 Book. Immediately: place 1 Guild on any empty Native terrain hex (no Reach needed).' },
];

// Round Bonus tiles are unnumbered in the rulebook; numbered here in the order of BGA's tile image.
export const BONUSES = [
  { id: 'b1', name: 'Bonus 1', sprite: 0, text: 'Workshop next to a river: 2 points. Reach +1.' },
  { id: 'b2', name: 'Bonus 2', sprite: 1, text: 'Send a Scholar: 2 points. Income: 1 Scholar.' },
  { id: 'b3', name: 'Bonus 3', sprite: 2, text: 'Action: Terraform and Build with 1 free Spade. Income: 1 Book.' },
  { id: 'b4', name: 'Bonus 4', sprite: 3, text: 'Action: place a Bridge for free. Income: 1 Book.' },
  { id: 'b5', name: 'Bonus 5', sprite: 4, text: 'When you Pass: 4 points per University/Palace. Income: 1 Tool.' },
  { id: 'b6', name: 'Bonus 6', sprite: 5, text: 'Action: advance 1 Level in a Discipline. Income: 2 Tools.' },
  { id: 'b7', name: 'Bonus 7', sprite: 6, text: 'Income: 4 power and 2 Coins.' },
  { id: 'b8', name: 'Bonus 8', sprite: 7, text: 'Income: 6 Coins.' },
  { id: 'b9', name: 'Bonus 9', sprite: 8, text: 'Build a Guild: 3 points. Income: 3 power.' },
  { id: 'b10', name: 'Bonus 10', sprite: 9, text: 'When you Pass: advance 1 Level per School. Income: 4 Coins.' },
];

// Tile artwork is hotlinked from Board Game Arena's sprite sheets. Each item's
// `sprite` is its cell index (left to right, then top to bottom); `aspect` is
// one cell's width / height. If BGA publishes a new release the folder name
// below changes, and the app falls back to text until it is updated.
export const IMAGE_BASE = 'https://x.boardgamearena.net/data/themereleases/current/games/ageofinnovation/260527-1653/img/';

export const SPRITES = {
  factions: { file: 'faction_tiles.jpg', cols: 12, rows: 1, aspect: (2000 / 12) / 95 },
  terrains: { file: 'terrain_tiles.jpg', cols: 7, rows: 1, aspect: (2000 / 7) / 436 },
  palaces: { file: 'stronghold_tiles.jpg', cols: 18, rows: 1, aspect: (2000 / 18) / 57 },
  bonuses: { file: 'bonus_cards.png', cols: 10, rows: 2, aspect: 150 / 400 },
};

export const ITEMS = {
  factions: FACTIONS,
  terrains: TERRAINS,
  palaces: PALACES,
  bonuses: BONUSES,
};

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 5;

// How many items of each category go into the pool for n players.
export function poolSize(category, n) {
  switch (category) {
    case 'factions': return n + 1;
    case 'terrains': return 6;
    case 'palaces': return n + 1;
    case 'bonuses': return n + 3;
    default: throw new Error(`Unknown category ${category}`);
  }
}

export function findItem(category, id) {
  return ITEMS[category].find((item) => item.id === id);
}
