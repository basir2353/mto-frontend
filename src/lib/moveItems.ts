export const MOVE_ITEM_SUGGESTIONS = [
  "Sofa",
  "Sectional sofa",
  "Loveseat",
  "Bed frame",
  "Mattress",
  "Box spring",
  "Dresser",
  "Nightstand",
  "Wardrobe",
  "Dining table",
  "Dining chairs",
  "Coffee table",
  "TV stand",
  "Bookshelf",
  "Desk",
  "Office chair",
  "Filing cabinet",
  "TV",
  "Monitor",
  "Refrigerator",
  "Washer",
  "Dryer",
  "Dishwasher",
  "Microwave",
  "Oven",
  "Boxes",
  "Wardrobe box",
  "Mirror",
  "Lamp",
  "Rug",
  "Carpet",
  "Patio furniture",
  "Grill",
  "Bicycle",
  "Treadmill",
  "Piano",
  "Crib",
  "Changing table",
  "Playpen",
  "Storage bins",
  "Suitcases",
  "Artwork",
  "Plants",
] as const;

const LOAD_TYPE_ITEMS: Record<string, string[]> = {
  Furniture: ["Sofa", "Bed frame", "Mattress", "Dresser", "Dining table", "Coffee table", "Bookshelf", "Desk"],
  Boxes: ["Boxes", "Wardrobe box", "Storage bins", "Suitcases"],
  Appliance: ["Refrigerator", "Washer", "Dryer", "Dishwasher", "Microwave", "TV"],
  "Single item": ["Sofa", "Mattress", "Refrigerator", "TV", "Desk", "Dining table"],
  "Store pickup": ["Boxes", "Furniture package", "Appliance", "TV", "Mattress"],
};

export function quickPickItems(loadType?: string, limit = 8): string[] {
  const fromType = loadType ? LOAD_TYPE_ITEMS[loadType] ?? [] : [];
  const merged = [...fromType, ...MOVE_ITEM_SUGGESTIONS];
  return [...new Set(merged)].slice(0, limit);
}

export function filterItemSuggestions(query: string, existing: string[], limit = 8): string[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return MOVE_ITEM_SUGGESTIONS.filter((item) => {
    const lower = item.toLowerCase();
    const taken = existing.some((e) => e.toLowerCase() === lower);
    return !taken && lower.includes(q);
  }).slice(0, limit);
}
