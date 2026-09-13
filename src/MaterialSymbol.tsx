export type MaterialSymbolName =
  | "arrow_upward"
  | "calendar_today"
  | "check_circle"
  | "close"
  | "coffee"
  | "design_services"
  | "directions_walk"
  | "event_available"
  | "explore"
  | "filter_alt"
  | "forest"
  | "hiking"
  | "hotel"
  | "info"
  | "landscape"
  | "lightbulb"
  | "local_cafe"
  | "location_on"
  | "map"
  | "menu_book"
  | "open_in_new"
  | "payments"
  | "rainy"
  | "restaurant"
  | "restaurant_menu"
  | "route"
  | "schedule"
  | "shopping_bag"
  | "storefront"
  | "sunny"
  | "takeout_dining"
  | "task_alt"
  | "timer"
  | "train"
  | "tune"
  | "work";

type MaterialSymbolProps = {
  name: MaterialSymbolName;
  className?: string;
};

export default function MaterialSymbol({ name, className = "" }: MaterialSymbolProps) {
  return <span className={`material-symbol ${className}`.trim()} aria-hidden="true">{name}</span>;
}
