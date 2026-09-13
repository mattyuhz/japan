import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Map as VectorMap } from "maplibre-gl";
import mapWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker.js?url";
import neighborhoods from "./data/neighborhoods.json";
import MaterialSymbol from "./MaterialSymbol";
import { categoryIcon } from "./categoryIcon";

export type SavedPlace = { title:string; url:string; area:string; neighborhood:string; lat:number; lng:number; categories:string[] };
type View = "list" | "neighborhoods" | "map";
type Neighborhood = typeof neighborhoods[number];
const UNKNOWN = "Neighborhood to confirm";
const centers = new Map(neighborhoods.map(n => [n.name, n]));
const groupPlaces = (places:SavedPlace[]) => Object.entries(places.reduce<Record<string,SavedPlace[]>>((all,p) => {
  (all[p.neighborhood] ??= []).push(p); return all;
}, {})).sort(([a],[b]) => a === UNKNOWN ? 1 : b === UNKNOWN ? -1 : a.localeCompare(b));

function distance(a:Neighborhood,b:Neighborhood) {
  const rad=Math.PI/180, dlat=(b.lat-a.lat)*rad, dlng=(b.lng-a.lng)*rad;
  return 12742*Math.asin(Math.sqrt(Math.sin(dlat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dlng/2)**2));
}

function MapView({places,selected,area,onSelect}:{places:SavedPlace[];selected:string;area:string;onSelect:(name:string)=>void}) {
  const node=useRef<HTMLDivElement>(null);
  const [ready,setReady]=useState<{map:VectorMap;lib:typeof import("maplibre-gl")}|null>(null);
  const [failed,setFailed]=useState(false);
  const groups=useMemo(()=>groupPlaces(places).filter(([name])=>centers.has(name)),[places]);
  useEffect(()=>{
    let active=true;
    let instance:VectorMap|undefined;
    import("maplibre-gl").then(L=>{
      if(!active||!node.current) return;
      L.setWorkerUrl(mapWorkerUrl);
      instance=new L.Map({container:node.current,style:"https://tiles.openfreemap.org/styles/dark",center:[139.73,35.68],zoom:11.5,attributionControl:{compact:true},canvasContextAttributes:{preserveDrawingBuffer:true}});
      const map=instance;
      map.addControl(new L.NavigationControl({showCompass:false}),"top-right");
      map.addControl(new L.ScaleControl({maxWidth:100,unit:"metric"}),"bottom-left");
      map.scrollZoom.disable();
      const updateDetail=()=>{if(node.current) node.current.dataset.detail=String(map.getZoom()>=13)};
      map.on("zoom",updateDetail);
      map.on("load",()=>{
        for(const layer of map.getStyle().layers){
          if(layer.type==="background") map.setPaintProperty(layer.id,"background-color","#171817");
          if(layer.type==="symbol"&&layer.layout?.["text-field"]){
            map.setPaintProperty(layer.id,"text-color","#c8c5bb");
            map.setPaintProperty(layer.id,"text-halo-color","#171817");
          }
        }
        updateDetail();
      });
      setReady({map,lib:L});
    }).catch(()=>{if(active) setFailed(true)});
    return()=>{active=false;instance?.remove()};
  },[]);
  useEffect(()=>{
    if(!ready) return;
    const markers=groups.map(([name,items])=>{
      const center=centers.get(name)!;
      const button=document.createElement("button");
      button.className="neighborhood-marker";
      button.dataset.selected=String(selected===name);
      button.setAttribute("aria-label",`${name}: ${items.length} saved places. Zoom to neighborhood.`);
      button.setAttribute("aria-pressed",String(selected===name));
      button.title=name;
      const label=document.createElement("span"); label.textContent=name;
      const count=document.createElement("b"); count.textContent=String(items.length);
      button.append(label,count);
      button.onclick=()=>onSelect(name);
      return new ready.lib.Marker({element:button}).setLngLat([center.lng,center.lat]).addTo(ready.map);
    });
    return()=>markers.forEach(marker=>marker.remove());
  },[ready,groups,selected,onSelect]);
  useEffect(()=>{
    if(!ready) return;
    const center=centers.get(selected);
    if(center){ready.map.flyTo({center:[center.lng,center.lat],zoom:14.5,duration:700});return}
    const anchors=neighborhoods.filter(n=>area==="ALL"||n.area===area);
    if(area==="Tokyo"){ready.map.flyTo({center:[139.735,35.681],zoom:11.5,duration:600});return}
    const bounds=new ready.lib.LngLatBounds();
    anchors.forEach(n=>bounds.extend([n.lng,n.lat]));
    if(!bounds.isEmpty()) ready.map.fitBounds(bounds,{padding:65,maxZoom:13,duration:600});
    else ready.map.flyTo({center:[138.25,36.2],zoom:5,duration:600});
  },[ready,selected,area]);
  return <div className="map-container"><p className="map-note">SELECT A MARKER TO ZOOM IN · DRAG TO EXPLORE · USE + / − TO ZOOM</p>
    {failed&&<p role="alert">The map could not start. You can still browse every neighborhood below.</p>}
    <div className="map-frame" ref={node} aria-label="Interactive neighborhood map" />
    <p className="location-note">Markers show neighborhood centers, not exact venue locations. Neighborhoods are inferred from place names; check the venue’s Maps link before heading out.</p>
  </div>;
}

function Nearby({selected,places,onSelect}:{selected:string;places:SavedPlace[];onSelect:(name:string)=>void}) {
  const center=centers.get(selected);
  if(!center) return null;
  const counts=new Map(groupPlaces(places).map(([name,items])=>[name,items.length]));
  const nearby=neighborhoods.filter(n=>n.area===center.area&&n.name!==selected&&counts.has(n.name))
    .map(n=>({...n,km:distance(center,n)})).sort((a,b)=>a.km-b.km).slice(0,4);
  if(!nearby.length) return null;
  return <aside className="nearby"><p className="kicker icon-label"><MaterialSymbol name="explore"/>WHERE NEXT?</p><h3>Nearby neighborhoods</h3>
    <p className="location-note">Distances are straight-line estimates between centers. Open directions for actual walking or train routes.</p>
    <div className="nearby-grid">{nearby.map(n=>{
      const route=`https://www.google.com/maps/dir/?api=1&origin=${center.lat},${center.lng}&destination=${n.lat},${n.lng}`;
      return <div className="nearby-card" key={n.name}><button onClick={()=>onSelect(n.name)}>{n.name} <span>↗</span></button>
        <p>{n.km.toFixed(1)} km · {counts.get(n.name)} saved places</p>
        <div><a className="action-link" href={route+"&travelmode=walking"} target="_blank" rel="noreferrer"><MaterialSymbol name="directions_walk"/>Walk<MaterialSymbol name="open_in_new"/></a><a className="action-link" href={route+"&travelmode=transit"} target="_blank" rel="noreferrer"><MaterialSymbol name="train"/>Transit<MaterialSymbol name="open_in_new"/></a></div>
      </div>;
    })}</div>
  </aside>;
}

export function PlacesExplorer({places}:{places:SavedPlace[]}) {
  const mapRegion=useRef<HTMLDivElement>(null);
  const [area,setArea]=useState("Tokyo"), [category,setCategory]=useState("ALL"), [query,setQuery]=useState("");
  const [view,setView]=useState<View>("list"), [selected,setSelected]=useState("ALL");
  const inArea=useMemo(()=>places.filter(p=>area==="ALL"||p.area===area),[area,places]);
  const categories=useMemo(()=>[...new Set(inArea.flatMap(p=>p.categories))].sort((a,b)=>a.localeCompare(b)),[inArea]);
  const options=useMemo(()=>groupPlaces(inArea),[inArea]);
  const matches=useMemo(()=>inArea.filter(p=>(category==="ALL"||p.categories.includes(category))&&
    (!query||(p.title+" "+p.neighborhood).toLocaleLowerCase().includes(query.toLocaleLowerCase()))),[inArea,category,query]);
  const visible=useMemo(()=>matches.filter(p=>selected==="ALL"||p.neighborhood===selected),[matches,selected]);
  const groups=useMemo(()=>groupPlaces(visible),[visible]);
  const unknownCount=matches.filter(p=>p.neighborhood===UNKNOWN).length;
  const onSelect=useCallback((name:string)=>{setSelected(name);mapRegion.current?.scrollIntoView({behavior:"smooth",block:"start"})},[]);
  const explore=(name:string)=>{setSelected(name);setView("map")};
  const setAreaFilter=(next:string)=>{setArea(next);setCategory("ALL");setSelected("ALL")};
  return <section id="places" className="places">
    <div className="section-head"><p className="kicker icon-label"><MaterialSymbol name="map"/>03 / SAVED PLACES</p><p className="quiet">Japan-only · personal notes excluded</p></div>
    <div className="place-intro"><h2>Your Maps lists,<br/>now by neighborhood.</h2><p>Start in Jimbocho, spend an afternoon in Ginza, or explore Kanda. Narrow your saved places to one neighborhood, then find your next stop nearby.</p></div>
    <div className="view-tabs" role="tablist" aria-label="Saved places view">{(["list","neighborhoods","map"] as View[]).map(item=><button role="tab" aria-selected={view===item} key={item} onClick={()=>setView(item)}><MaterialSymbol name={item==="list"?"menu_book":item==="map"?"map":"location_on"}/>{item}</button>)}</div>
    <div className="place-controls"><div className="area-filters" aria-label="Filter places by area">{["Tokyo","Kamakura","Kyoto","Osaka","Elsewhere","ALL"].map(item=><button key={item} aria-pressed={area===item} onClick={()=>setAreaFilter(item)}>{item}</button>)}</div>
      <div className="place-inputs">
        <label><span className="icon-label"><MaterialSymbol name="location_on"/>NEIGHBORHOOD</span><select value={selected} onChange={e=>setSelected(e.target.value)}><option value="ALL">All neighborhoods</option>{options.map(([name,items])=><option key={name} value={name}>{name} ({items.length})</option>)}</select></label>
        <label><span className="icon-label"><MaterialSymbol name="filter_alt"/>SEARCH</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Place or neighborhood" /></label>
        <label><span className="icon-label"><MaterialSymbol name={category==="ALL"?"tune":categoryIcon([category])}/>CATEGORY</span><select value={category} onChange={e=>setCategory(e.target.value)}><option value="ALL">All categories</option>{categories.map(item=><option key={item} value={item}>{item}</option>)}</select></label>
      </div>
    </div>
    <div className="place-result"><p>{visible.length.toLocaleString()} PLACES · {selected==="ALL" ? `${groups.filter(([name])=>name!==UNKNOWN).length} NAMED NEIGHBORHOODS` : selected.toUpperCase()}</p>{selected!=="ALL"&&<button className="text-button" onClick={()=>setSelected("ALL")}>← All neighborhoods</button>}</div>
    {selected==="ALL"&&unknownCount>0&&<p className="location-note">{unknownCount.toLocaleString()} listings need more location detail. <button className="text-button" onClick={()=>setSelected(UNKNOWN)}>Browse neighborhoods to confirm →</button></p>}
    {view==="list"&&<PlaceList key={area+selected+category+query} places={visible}/>}
    {view==="neighborhoods"&&<div className="neighborhood-list">{groups.map(([name,items])=><section className="neighborhood-group" key={name}>
      <header><h3><MaterialSymbol name={name===UNKNOWN?"info":"location_on"}/>{name}</h3><span>{items.length} places</span>{name!==UNKNOWN&&<button className="text-button" onClick={()=>explore(name)}>Explore on map ↗</button>}</header>
      <PlaceList places={items} initial={6}/>
    </section>)}</div>}
    {view==="map"&&<>
      <div ref={mapRegion} className="map-region"><MapView places={matches} selected={selected} area={area} onSelect={onSelect}/></div>
      {selected==="ALL" ? <div className="neighborhood-picker">{groupPlaces(matches).map(([name,items])=><button key={name} onClick={()=>setSelected(name)}>{name}<span>{items.length}</span></button>)}</div>
      : <section className="map-selection"><header><p className="kicker icon-label"><MaterialSymbol name="directions_walk"/>EXPLORE ON FOOT</p><h3>{selected}</h3><p>{visible.length} saved places matching your filters</p></header>
        {selected===UNKNOWN&&<p className="location-note">These listings are not mapped because the export does not provide a reliable neighborhood. Open each venue in Google Maps to check its location.</p>}
        <PlaceList key={area+selected+category+query} places={visible}/>
        <Nearby selected={selected} places={matches} onSelect={onSelect}/>
      </section>}
    </>}
    {visible.length===0&&<p className="place-empty">No matches. Try another neighborhood or clear your search and category filters.</p>}
  </section>;
}

function PlaceList({places,initial=40}:{places:SavedPlace[];initial?:number}) {
  const [limit,setLimit]=useState(initial);
  return <div className="place-list">{places.slice(0,limit).map(place=><a href={place.url} target="_blank" rel="noreferrer" className="place-row" key={place.url+"-"+place.title}>
    <h3><MaterialSymbol name={categoryIcon(place.categories)}/><span className="place-title-text">{place.title}</span></h3><p>{place.categories.join(" · ")}</p><span>{place.neighborhood}</span><MaterialSymbol name="open_in_new"/>
  </a>)}{places.length>limit&&<button className="show-more" onClick={()=>setLimit(limit+40)}>Show more · {places.length-limit} remaining ↓</button>}</div>;
}
