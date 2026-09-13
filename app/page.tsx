"use client";

import MaterialSymbol from "../src/MaterialSymbol";
import savedPlaces from "../src/data/japan-places.json";
import { PlacesExplorer, type SavedPlace } from "../src/PlacesExplorer";

const itinerary = [
  { date: "NOV 10", city: "SFO → NRT", stay: "IN FLIGHT", note: "JL057 · 11:45 departure", status: "CONFIRMED" },
  { date: "NOV 11–13", city: "TOKYO / EAST", stay: "CAPTION KABUTOCHO", note: "Arrival reset · central Tokyo · Kamakura", status: "CONFIRMED" },
  { date: "NOV 14–16", city: "TOKYO / WEST", stay: "HYATT HOUSE SHIBUYA", note: "Neighborhood days · food · design", status: "CONFIRMED" },
  { date: "NOV 17–18", city: "KYOTO", stay: "HYATT PLACE KYOTO", note: "Autumn color · early starts", status: "CONFIRMED" },
  { date: "NOV 19–20", city: "OSAKA", stay: "RITZ + TBD", note: "One hotel night still to solve", status: "1 NIGHT OPEN" },
  { date: "NOV 21–22", city: "TOKYO / FINALE", stay: "ANDAZ TOKYO", note: "A deliberate two-night finish", status: "HOLD" },
  { date: "NOV 23", city: "TOKYO → SFO", stay: "RETURN", note: "Target: 2× JAL business awards", status: "PRIORITY" },
];
const stays = [
  ["01", "CAPTION KABUTOCHO", "NOV 11–13", "60K HYATT", "CONFIRMED"], ["02", "HYATT HOUSE SHIBUYA", "NOV 14–16", "63K HYATT", "CONFIRMED"], ["03", "HYATT PLACE KYOTO", "NOV 17–18", "19K HYATT", "CONFIRMED"], ["04", "RITZ-CARLTON OSAKA", "NOV 19", "$169 EFFECTIVE", "CONFIRMED"], ["05", "OSAKA / TBD", "NOV 20", "CASH", "OPEN"], ["06", "ANDAZ TOKYO", "NOV 21–22", "80K HYATT", "HOLD"],
];
export default function Home({planningOnly=false}:{planningOnly?:boolean}) {
  const Container=planningOnly?"div":"main";
  const places = savedPlaces as SavedPlace[];

  return <Container>
  {!planningOnly&&<><header className="masthead" id="top"><div><p className="eyebrow">FIELD PLAN · 2026</p><h1>JAPAN</h1></div><p className="edition">10—23 NOV<br/>MATT + WIFE<br/>V01 / SEP 02</p></header>
  <nav aria-label="Page sections"><a className="icon-label" href="#route"><MaterialSymbol name="route"/>ROUTE</a><a className="icon-label" href="#decisions"><MaterialSymbol name="task_alt"/>DECISIONS</a><a className="icon-label" href="#places"><MaterialSymbol name="map"/>SAVED PLACES</a><a className="icon-label" href="#stays"><MaterialSymbol name="hotel"/>STAYS</a><a className="icon-label" href="#kamakura"><MaterialSymbol name="hiking"/>KAMAKURA</a><a className="icon-label" href="#principles"><MaterialSymbol name="menu_book"/>NOTES</a></nav></>}
  <section className="intro"><p className="kicker">THE TRIP IN ONE LINE</p><h2>Tokyo 6 → Kyoto 2 → Osaka 2 → Tokyo 2 → home.</h2><div className="intro-grid"><p>A working field plan for a repeat Japan visit: local food, specialty coffee, design, outdoor gear, neighborhood wandering, and autumn color.</p><div className="numbers"><span><b>13</b>DAYS</span><span><b>12</b>NIGHTS</span><span><b>4</b>BASES</span></div></div></section>
  <section id="route"><div className="section-head"><p className="kicker">01 / ROUTE</p><p className="quiet">Few anchors. Nearby options. Room to wander.</p></div><div className="route-head"><span>DATE</span><span>PLACE / STAY</span><span>PLAN</span><span>STATUS</span></div><div className="route-list">{itinerary.map(day=><article className="route-row" key={day.date}><span className="date">{day.date}</span><div><h3>{day.city}</h3><p>{day.stay}</p></div><p>{day.note}</p><span className="status">{day.status}</span></article>)}</div></section>
  <section id="decisions"><div className="section-head"><p className="kicker">02 / NEXT DECISIONS</p><p className="quiet">Solve in this order.</p></div><div className="decision-grid"><article className="decision primary"><span>01 · HIGHEST PRIORITY</span><h2>Secure the return.</h2><p>Two JAL business awards from Tokyo to San Francisco on Monday, November 23. Verify bookability, airport, aircraft, fees, transfer timing, and cancellation rules before moving 140,000 Bilt points.</p><footer><span>TARGET</span><b>2 × 70K JAL</b></footer></article><article className="decision"><span>02 · OPEN</span><h2>Book November 20.</h2><p>Stay a second Osaka night at a moderate, refundable hotel. Favor a neighborhood that complements Umeda and keeps Saturday’s Shinkansen simple.</p><footer><span>DEFAULT</span><b>OSAKA / CASH</b></footer></article><article className="decision"><span>03 · HOLD</span><h2>Keep the Andaz—for now.</h2><p>It works when Monday’s return is secured and Sunday remains a full finale. Reassess only after the flight is solved.</p><footer><span>COST</span><b>80K HYATT</b></footer></article></div></section>
  {!planningOnly&&<PlacesExplorer places={places}/>}
  <section id="stays"><div className="section-head"><p className="kicker">04 / STAYS</p><p className="quiet">142K Hyatt without Andaz · 222K with it</p></div><div className="stay-list">{stays.map(([n,name,dates,cost,status])=><div className="stay-row" key={n}><span>{n}</span><h3>{name}</h3><span>{dates}</span><span>{cost}</span><span className="status">{status}</span></div>)}</div></section>
  <section id="kamakura" className="kamakura"><div className="section-head"><p className="kicker">05 / KAMAKURA FIELD DAY</p><p className="quiet">Friday · November 13</p></div><div className="kamakura-title"><h2>Gear, food, and place.<br/>Not a retail errand.</h2><p>Tokyo → Kita-Kamakura → Kamakura / Yuigahama → Tokyo</p></div><ol className="anchors"><li><span>01</span><div><h3>T2 EXPERIENCE STORE</h3><p>Verify access, hours, and appointment requirements.</p></div></li><li><span>02</span><div><h3>YAMATOMICHI KAMAKURA</h3><p>Primary shop visit. Recheck the November Store Program.</p></div></li><li><span>03</span><div><h3>LOCAL MEAL</h3><p>Resident-loved and specific to Kamakura—not a tourist-review default.</p></div></li><li><span>04</span><div><h3>ONE REAL PLACE</h3><p>A meaningful stop or the Yuigahama coast, with time left unscheduled.</p></div></li></ol></section>
  <section id="principles"><div className="section-head"><p className="kicker">06 / OPERATING PRINCIPLES</p><p className="quiet">What makes the trip good.</p></div><div className="principle-grid"><p><span>01</span>Distinctive local food over nightlife.</p><p><span>02</span>Organize by neighborhood, not citywide lists.</p><p><span>03</span>Start early for Kyoto autumn color.</p><p><span>04</span>Premium return comfort is non-negotiable.</p><p><span>05</span>Verify live conditions before transferring points.</p><p><span>06</span>A strong trip beats more destinations.</p></div></section>
  {!planningOnly&&<footer className="site-footer"><a href="#top">↑ TOP</a><p>JAPAN · NOVEMBER 2026<br/>WORKING PLAN / NOT A CHECKLIST</p></footer>}
</Container> }
