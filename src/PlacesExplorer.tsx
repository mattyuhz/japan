import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";

export type SavedPlace = { title:string; url:string; area:string; neighborhood:string; lat:number; lng:number; categories:string[] };
type View = "list" | "neighborhoods" | "map";

const neighborhoodCenters:Record<string,[number,number]>={
  "Kabutocho / Nihonbashi":[35.6828,139.778],"Ginza / Marunouchi":[35.6742,139.7632],Shibuya:[35.6595,139.7005],"Ebisu / Daikanyama":[35.6484,139.705],"Aoyama / Omotesando":[35.6652,139.7122],Nakameguro:[35.6443,139.6991],Shinjuku:[35.6938,139.7034],Shimokitazawa:[35.6616,139.668],"Koenji / Nakano":[35.7053,139.6587],Kichijoji:[35.7033,139.5797],"Roppongi / Akasaka":[35.667,139.735],"Kanda / Jimbocho":[35.6948,139.7577],"Ueno / Yanaka":[35.719,139.773],"Asakusa / Kuramae":[35.7107,139.7937],Ikebukuro:[35.7295,139.7109],"Tsukiji / Kachidoki":[35.6617,139.777],Setagaya:[35.6466,139.6532],Yokohama:[35.4437,139.638],Chiba:[35.6073,140.1063],Saitama:[35.8617,139.6455],Kamakura:[35.3192,139.5467],"Kita-Kamakura":[35.3373,139.5441],"Yuigahama / Hase":[35.3112,139.5352],"Central Kyoto":[35.0116,135.7681],"Gion / Higashiyama":[35.0037,135.7786],Arashiyama:[35.0094,135.6668],Fushimi:[34.9355,135.7616],"Northern Kyoto":[35.045,135.75],"Umeda / Kitashinchi":[34.7025,135.4959],"Namba / Shinsaibashi":[34.669,135.501],"Nakazakicho / Tenma":[34.706,135.508],Fukushima:[34.6955,135.4865],Tennoji:[34.6467,135.5133],Sakai:[34.5733,135.4831],Kobe:[34.6901,135.1955],Nara:[34.6851,135.8048]
};

function escapeHtml(value:string) { return value.replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]!)); }

function MapView({places}:{places:SavedPlace[]}) {
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  useEffect(() => {
    let active = true;
    import("leaflet").then((L) => {
      if (!active || !node.current) return;
      map.current?.remove();
      const instance=L.map(node.current,{zoomControl:true,attributionControl:true,preferCanvas:true});
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(instance);
      const bounds=L.latLngBounds([]);
      const groups=Object.entries(places.reduce<Record<string,SavedPlace[]>>((all,place)=>{(all[place.neighborhood]??=[]).push(place);return all},{}));
      groups.forEach(([name,items])=>{
        const center=neighborhoodCenters[name]??[items.reduce((sum,p)=>sum+p.lat,0)/items.length,items.reduce((sum,p)=>sum+p.lng,0)/items.length] as [number,number];
        const marker=L.circleMarker(center,{radius:Math.min(20,6+Math.sqrt(items.length)),color:"#050505",weight:2,fillColor:"#f4f2ec",fillOpacity:.92});
        const samples=items.slice(0,5).map(place=>`<a href="${place.url}" target="_blank" rel="noreferrer">${escapeHtml(place.title)} ↗</a>`).join("");
        marker.bindPopup(`<strong>${escapeHtml(name)}</strong><small>${items.length.toLocaleString()} SAVED PLACES</small><div class="map-samples">${samples}</div>`).addTo(instance);
        bounds.extend(center);
      });
      if(bounds.isValid()) instance.fitBounds(bounds,{padding:[24,24],maxZoom:13}); else instance.setView([36.2,138.25],5);
      map.current=instance;
    });
    return()=>{active=false;map.current?.remove();map.current=null};
  },[places]);
  return <div><p className="map-note">NEIGHBORHOOD OVERVIEW · MARKER SIZE SHOWS SAVED-PLACE COUNT</p><div className="map-frame" ref={node} aria-label={`Map of neighborhoods containing ${places.length} saved places`} /></div>;
}

export function PlacesExplorer({places}:{places:SavedPlace[]}) {
  const [area,setArea]=useState("Tokyo"); const [category,setCategory]=useState("ALL"); const [query,setQuery]=useState(""); const [view,setView]=useState<View>("list");
  const categories=useMemo(()=>[...new Set(places.filter(p=>area==="ALL"||p.area===area).flatMap(p=>p.categories))].sort((a,b)=>a.localeCompare(b)),[area,places]);
  const matches=useMemo(()=>places.filter(p=>(area==="ALL"||p.area===area)&&(category==="ALL"||p.categories.includes(category))&&(!query||p.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()))),[area,category,query,places]);
  const groups=useMemo(()=>Object.entries(matches.reduce<Record<string,SavedPlace[]>>((all,place)=>{(all[place.neighborhood]??=[]).push(place);return all},{})).sort((a,b)=>b[1].length-a[1].length),[matches]);
  const setAreaFilter=(next:string)=>{setArea(next);setCategory("ALL")};
  return <section id="places" className="places">
    <div className="section-head"><p className="kicker">03 / SAVED PLACES</p><p className="quiet">Japan-only · personal notes excluded</p></div>
    <div className="place-intro"><h2>Your Maps lists,<br/>now by neighborhood.</h2><p>{places.length.toLocaleString()} public venues gathered from your category lists. Browse the list, scan neighborhood clusters, or explore the map.</p></div>
    <div className="view-tabs" role="tablist" aria-label="Saved places view">{(["list","neighborhoods","map"] as View[]).map(item=><button role="tab" aria-selected={view===item} key={item} onClick={()=>setView(item)}>{item}</button>)}</div>
    <div className="place-controls"><div className="area-filters" aria-label="Filter places by area">{["Tokyo","Kamakura","Kyoto","Osaka","Elsewhere","ALL"].map(item=><button key={item} aria-pressed={area===item} onClick={()=>setAreaFilter(item)}>{item}</button>)}</div><div className="place-inputs"><label><span>SEARCH</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Place name" /></label><label><span>CATEGORY</span><select value={category} onChange={event=>setCategory(event.target.value)}><option value="ALL">All categories</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label></div></div>
    <div className="place-result"><p>{matches.length.toLocaleString()} PLACES · {new Set(matches.map(p=>p.neighborhood)).size} NEIGHBORHOODS</p>{view==="list"&&matches.length>80&&<p>SHOWING FIRST 80 · REFINE THE FILTERS</p>}</div>
    {view==="list"&&<div className="place-list">{matches.slice(0,80).map(place=><PlaceRow place={place} key={`${place.url}-${place.title}`} />)}</div>}
    {view==="neighborhoods"&&<div className="neighborhood-list">{groups.map(([name,items])=><section className="neighborhood-group" key={name}><header><h3>{name}</h3><span>{items!.length}</span></header><div className="place-list">{items!.map(place=><PlaceRow place={place} key={`${place.url}-${place.title}`} />)}</div></section>)}</div>}
    {view==="map"&&<MapView places={matches}/>} {matches.length===0&&<p className="place-empty">No matches. Try another area or category.</p>}
  </section>;
}

function PlaceRow({place}:{place:SavedPlace}) { return <a href={place.url} target="_blank" rel="noreferrer" className="place-row"><h3>{place.title}</h3><p>{place.categories.join(" · ")}</p><span>{place.neighborhood}</span><b aria-hidden="true">↗</b></a> }
