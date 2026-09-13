import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import maplibregl, { type Map as VectorMap } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker.js?url";
import MaterialSymbol from "./MaterialSymbol";
import neighborhoods from "./data/neighborhoods.json";
import places from "./data/japan-places.json";
import "maplibre-gl/dist/maplibre-gl.css";
import "../app/icons.css";
import "./map-options.css";

maplibregl.setWorkerUrl(workerUrl);
const options=[
  {id:"atlas",letter:"A",name:"Paper atlas",tag:"QUIET + EDITORIAL",description:"Warm ivory, restrained blue water, dark labels. The cleanest contrast against the black guide.",tradeoff:"Less background detail; your neighborhoods take priority."},
  {id:"wayfinder",letter:"B",name:"City wayfinder",tag:"DETAIL + ORIENTATION",description:"Blue waterways, green parks, distinct roads and more place labels. Built around finding your bearings.",tradeoff:"More visual information, less minimalist."},
  {id:"night",letter:"C",name:"Night atlas",tag:"DARK + LEGIBLE",description:"Slate instead of black, brighter streets, clearer water and park shapes. Keeps the guide’s dark character.",tradeoff:"A closer match to the site, with less contrast than paper."},
];
const counts=new Map<string,number>();places.forEach(p=>counts.set(p.neighborhood,(counts.get(p.neighborhood)??0)+1));
const anchors=neighborhoods.filter(n=>n.area==="Tokyo"&&counts.has(n.name));
type Camera={center:[number,number];zoom:number;bearing:number;pitch:number};
type Ready=(id:string,map:VectorMap|null)=>void;

function MapOption({option,onReady,onMove,onPick}:{option:typeof options[number];onReady:Ready;onMove:(id:string)=>void;onPick:(name:string)=>void}){
  const node=useRef<HTMLDivElement>(null);
  const [loaded,setLoaded]=useState(false);
  const [error,setError]=useState(false);
  useEffect(()=>{
    if(!node.current)return;
    const map=new maplibregl.Map({container:node.current,style:import.meta.env.BASE_URL+"map-options/"+option.id+".json",center:[139.763,35.693],zoom:13.5,attributionControl:{compact:true},canvasContextAttributes:{preserveDrawingBuffer:true}});
    map.addControl(new maplibregl.NavigationControl({showCompass:false}),"top-right");
    map.addControl(new maplibregl.ScaleControl({unit:"metric",maxWidth:90}),"bottom-left");
    map.scrollZoom.disable();
    map.on("load",()=>setLoaded(true));
    map.on("error",()=>setError(true));
    map.on("move",()=>onMove(option.id));
    anchors.forEach(n=>{
      const marker=document.createElement("button");marker.className="option-marker";
      marker.setAttribute("aria-label",`${n.name}, ${counts.get(n.name)} saved places. Center all maps here.`);
      const label=document.createElement("span");label.textContent=n.name;
      const count=document.createElement("b");count.textContent=String(counts.get(n.name));
      marker.append(label,count);marker.onclick=()=>onPick(n.name);
      new maplibregl.Marker({element:marker}).setLngLat([n.lng,n.lat]).addTo(map);
    });
    const resize=new ResizeObserver(()=>map.resize());resize.observe(node.current);
    onReady(option.id,map);
    return()=>{resize.disconnect();onReady(option.id,null);map.remove()};
  },[option,onReady,onMove,onPick]);
  return <><div ref={node} className="option-map" aria-label={`${option.letter}: ${option.name} interactive map`}/>{!loaded&&<p className="load-note" role="status">{error?"Map could not load. Check your connection and reload.":"Loading vector map…"}</p>}</>;
}

function MapOptions(){
  const maps=useRef(new Map<string,VectorMap>()),syncing=useRef(false);
  const camera=useRef<Camera>({center:[139.763,35.693],zoom:13.5,bearing:0,pitch:0});
  const [focus,setFocus]=useState("all"),[area,setArea]=useState("Jimbocho"),[choice,setChoice]=useState("");
  const onReady=useCallback<Ready>((id,map)=>{if(map){maps.current.set(id,map);map.jumpTo(camera.current)}else maps.current.delete(id)},[]);
  const onMove=useCallback((id:string)=>{
    if(syncing.current)return;
    const source=maps.current.get(id);if(!source)return;
    const center=source.getCenter();camera.current={center:[center.lng,center.lat],zoom:source.getZoom(),bearing:source.getBearing(),pitch:source.getPitch()};
    syncing.current=true;maps.current.forEach((map,key)=>{if(key!==id)map.jumpTo(camera.current)});syncing.current=false;
  },[]);
  const onPick=useCallback((name:string)=>{
    const n=anchors.find(n=>n.name===name);if(!n)return;
    setArea(name);camera.current={center:[n.lng,n.lat],zoom:14,bearing:0,pitch:0};
    syncing.current=true;maps.current.forEach(map=>map.jumpTo(camera.current));syncing.current=false;
  },[]);
  return <main className="map-options-page"><header className="options-heading"><div><p className="eyebrow">JAPAN / DESIGN STUDY 01</p><h1>Three ways to see the city.</h1><p>Same neighborhoods. Same zoom. Different map character.</p></div><a className="back-link" href={import.meta.env.BASE_URL+"#places"}>Back to your guide ↗</a></header>
    <div className="comparison-toolbar"><div className="comparison-tabs" role="group" aria-label="Compare or enlarge map options"><button aria-pressed={focus==="all"} onClick={()=>setFocus("all")}>Compare all</button>{options.map(o=><button key={o.id} aria-pressed={focus===o.id} onClick={()=>setFocus(o.id)}>{o.letter} / {o.name}</button>)}</div><label>NEIGHBORHOOD<select value={area} onChange={e=>onPick(e.target.value)}>{anchors.map(n=><option key={n.name}>{n.name}</option>)}</select></label></div>
    <p className="comparison-hint"><MaterialSymbol name="directions_walk"/>Drag or zoom any map—all three stay in sync. Click a neighborhood marker to center it.</p>
    <div className={`options-grid ${focus!=="all"?"focused":""}`}>{options.map(o=><section className={`map-option ${o.id}`} key={o.id} hidden={focus!=="all"&&focus!==o.id}>
      <header><span className="option-letter">{o.letter}</span><div><p>{o.tag}</p><h2>{o.name}</h2></div></header>
      <MapOption option={o} onReady={onReady} onMove={onMove} onPick={onPick}/>
      <div className="option-copy"><p>{o.description}</p><p className="tradeoff">{o.tradeoff}</p><button className="choose-option" aria-pressed={choice===o.id} onClick={()=>setChoice(o.id)}><MaterialSymbol name={choice===o.id?"check_circle":"map"}/>{choice===o.id?`Selected ${o.letter}`:`I prefer ${o.letter}`}</button></div>
    </section>)}</div>
    <div className="choice-summary" aria-live="polite">{choice?`Your preview choice: ${options.find(o=>o.id===choice)!.letter} — ${options.find(o=>o.id===choice)!.name}. Tell me your choice in the chat and I’ll apply it.`:"Choose A, B, or C—or tell me which parts you’d like combined."}</div>
    <footer><p>Comparison only. Your live guide’s map is unchanged. Selection here is not saved or published.</p><p>Markers are neighborhood centers, not exact venue pins. All three use vector maps. <a href="https://openfreemap.org/quick_start/">Basemaps: OpenFreeMap / OpenStreetMap</a>.</p></footer>
  </main>;
}
createRoot(document.getElementById("root")!).render(<React.StrictMode><MapOptions/></React.StrictMode>);
