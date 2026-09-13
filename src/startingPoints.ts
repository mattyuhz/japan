import type { SavedPlace } from "./PlacesExplorer";
import { categoryIcon } from "./categoryIcon";

// A transparent diversity sample, not a quality ranking or inferred route.
export function startingPoints(places:SavedPlace[],limit=4):SavedPlace[]{
  if(limit<=0)return [];
  const chosen:SavedPlace[]=[],categories=new Set<string>();
  for(const place of places){
    const group=categoryIcon(place.categories);
    if(!categories.has(group)){categories.add(group);chosen.push(place)}
    if(chosen.length===limit)return chosen;
  }
  for(const place of places){if(!chosen.includes(place))chosen.push(place);if(chosen.length===limit)break}
  return chosen;
}
