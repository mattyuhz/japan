import type { MaterialSymbolName } from "./MaterialSymbol";

// Use the same compact, filled symbol vocabulary as the Zurich guide.
export function categoryIcon(categories:string[]):MaterialSymbolName {
  const category=categories.find(c=>!['Default list','Favorite places'].includes(c))?.toLowerCase()??'';
  if (/coffee|cafe|kissaten|^tea$|drinks|juice|^milk$/.test(category)) return "local_cafe";
  if (/book|stationery/.test(category)) return "menu_book";
  if (/outdoor gear|running|summit|peak/.test(category)) return "hiking";
  if (/garden|park|outdoors/.test(category)) return "forest";
  if (/hotel/.test(category)) return "hotel";
  if (/museum|architecture|ceramic|craft|design|art|furniture/.test(category)) return "design_services";
  if (/clothing|shopping|bags|beauty|camera|eyewear|home goods|jewelry|kitchenware|music|secondhand|shoes/.test(category)) return "shopping_bag";
  if (/shrine|temple|sight|activity|spa/.test(category)) return "explore";
  if (/bakery|pastry|cake|confection|doughnut|ice cream|pie|snack|sweet/.test(category)) return "takeout_dining";
  if (/american|asian|bbq|breakfast|brunch|burger|chicken|chinese|curry|food|grocery|italian|izak|japanese|noodle|okinawan|onigiri|pizza|ramen|sandwich|seafood|sushi|takoyaki|tea|tempura|yakiniku|yakitori/.test(category)) return "restaurant";
  return "location_on";
}
