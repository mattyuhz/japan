import { useCallback, useMemo, useRef, useState } from "react";
import Home from "../app/page";
import { MapView, Nearby, PlacesExplorer, type SavedPlace } from "./PlacesExplorer";
import MaterialSymbol from "./MaterialSymbol";
import { categoryIcon } from "./categoryIcon";
import saved from "./data/japan-places.json";
import { startingPoints } from "./startingPoints";
import "./trial-guide.css";

const places=saved as SavedPlace[];
const known=places.filter(p=>p.neighborhood!=="Neighborhood to confirm");
const featured=["Jimbocho","Ginza","Kanda","Shibuya"];
type Mode="explore"|"saved"|"plan";

export default function TrialGuide(){
  const exploreTop=useRef<HTMLDivElement>(null);
  const [mode,setMode]=useState<Mode>("explore");
  const [area,setArea]=useState("Tokyo"),[selected,setSelected]=useState("Jimbocho");
  const [showMap,setShowMap]=useState(false),[showAll,setShowAll]=useState(false);
  const areaPlaces=useMemo(()=>places.filter(p=>p.area===area),[area]);
  const neighborhoods=useMemo(()=>[...new Set(known.filter(p=>p.area===area).map(p=>p.neighborhood))].sort(),[area]);
  const inNeighborhood=useMemo(()=>areaPlaces.filter(p=>p.neighborhood===selected),[areaPlaces,selected]);
  const shortlist=useMemo(()=>startingPoints(inNeighborhood),[inNeighborhood]);
  const choose=useCallback((name:string)=>{setSelected(name);setShowAll(false)},[]);
  const changeArea=(next:string)=>{setArea(next);choose(next==="Tokyo"?"Jimbocho":known.find(p=>p.area===next)?.neighborhood??"")};
  return <main className="trial-guide">
    <header className="trial-header"><div><span>JAPAN</span><p>10–23 NOVEMBER 2026</p></div><small>NEIGHBORHOOD-FIRST TRIAL<br/>Live guide unchanged</small></header>
    <nav className="trial-nav" aria-label="Guide mode">{([
      ["explore","explore","Explore"],["saved","menu_book","All saved places"],["plan","calendar_today","Trip plan"],
    ] as const).map(([value,icon,label])=><button key={value} aria-pressed={mode===value} onClick={()=>setMode(value)}><MaterialSymbol name={icon}/>{label}</button>)}</nav>
    {mode==="explore"&&<div className="trial-explore" ref={exploreTop}>
      <div className="trial-heading"><h1>One neighborhood at a time.</h1><p>Pick an area. Find a few saved stops. Leave room to wander.</p></div>
      <div className="trial-selectors"><label>City<select value={area} onChange={e=>changeArea(e.target.value)}>{["Tokyo","Kyoto","Osaka","Kamakura"].map(a=><option key={a}>{a}</option>)}</select></label><label>Neighborhood<select value={selected} onChange={e=>choose(e.target.value)}>{neighborhoods.map(n=><option key={n}>{n}</option>)}</select></label></div>
      {area==="Tokyo"&&<div className="trial-quick" role="group" aria-label="Quick neighborhood choices">{featured.map(n=><button key={n} aria-pressed={selected===n} onClick={()=>choose(n)}>{n}</button>)}</div>}
      <section className="trial-stops" aria-labelledby="neighborhood-heading"><div className="trial-section-heading"><div><p className="kicker">START WITH A FEW</p><h2 id="neighborhood-heading">{selected||area}</h2></div><button className="trial-map-toggle" aria-expanded={showMap} onClick={()=>setShowMap(!showMap)}><MaterialSymbol name="map"/>{showMap?"Hide map":"Show map"}</button></div>
        <p className="trial-confidence"><MaterialSymbol name="info"/>Neighborhoods are inferred from names, not verified addresses. Check each place in Maps before going.</p>
        <p className="trial-shortlist-note">A category mix from your saves—not a ranking or a walking route.</p>
        <div className="trial-stop-list">{(showAll?inNeighborhood:shortlist).map(place=><a key={place.url} href={place.url} target="_blank" rel="noreferrer" className="trial-stop"><MaterialSymbol name={categoryIcon(place.categories)}/><div><h3>{place.title}</h3><p>{place.categories.join(" · ")}</p></div><span className="trial-place-action">Open place<MaterialSymbol name="open_in_new"/></span></a>)}</div>
        {!inNeighborhood.length&&<p>No places assigned here yet. Your full saved collection is still available under All saved places.</p>}
        {inNeighborhood.length>shortlist.length&&<button className="trial-expand" aria-expanded={showAll} onClick={()=>setShowAll(!showAll)}>{showAll?"Back to the short list":`See all ${inNeighborhood.length} saved places in ${selected}`}<MaterialSymbol name={showAll?"arrow_upward":"menu_book"}/></button>}
      </section>
      {showMap&&<div className="trial-map"><MapView places={areaPlaces} selected={selected} area={area} onSelect={choose}/></div>}
      <Nearby selected={selected} places={areaPlaces} onSelect={name=>{choose(name);exploreTop.current?.scrollIntoView({block:"start"})}}/>
      <details className="trial-data"><summary>What’s missing from this view?</summary><p>Only places with an inferred neighborhood appear here. {places.filter(p=>p.neighborhood==="Neighborhood to confirm").length.toLocaleString()} saved listings still need location detail. They have not been deleted; find them under All saved places → Neighborhood to confirm.</p><p>Map markers and nearby directions use neighborhood centers, not exact venue addresses. This branch tests the browsing layout; it does not fix or verify the underlying locations.</p></details>
    </div>}
    {mode==="saved"&&<div className="trial-archive"><div className="trial-heading"><h1>Your full collection.</h1><p>Every imported place is still here, including listings awaiting a neighborhood.</p></div><PlacesExplorer places={places}/></div>}
    {mode==="plan"&&<div className="trial-planning"><div className="trial-heading"><h1>Before you head out.</h1><p>Route, stays, open decisions, and the original working plan. Booking status is copied from the existing guide, not rechecked.</p></div><Home planningOnly/></div>}
    <footer className="trial-footer">Experimental branch · no changes to the live guide <a href="https://mattyuhz.github.io/japan/" target="_blank" rel="noreferrer">Compare with live ↗</a></footer>
  </main>;
}
