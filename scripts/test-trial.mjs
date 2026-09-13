import assert from 'node:assert/strict';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try {
  const {startingPoints}=await server.ssrLoadModule('/src/startingPoints.ts');
  const {default:places}=await server.ssrLoadModule('/src/data/japan-places.json');
  const original=JSON.stringify(places);
  const jimbocho=places.filter(p=>p.neighborhood==='Jimbocho');
  const chosen=startingPoints(jimbocho);
  assert.equal(chosen.length,4);
  assert.equal(new Set(chosen.map(p=>p.url)).size,4);
  assert(chosen.every(p=>jimbocho.includes(p)));
  assert(chosen.some(p=>p.categories.includes('Coffee')));
  assert(chosen.some(p=>p.categories.includes('Outdoor Gear')));
  assert.deepEqual(startingPoints([]),[]);
  assert.deepEqual(startingPoints(jimbocho,0),[]);
  assert.equal(startingPoints(jimbocho,100).length,jimbocho.length);
  assert.equal(JSON.stringify(places),original);
  const {default:Trial}=await server.ssrLoadModule('/src/TrialGuide.tsx');
  const {default:Home}=await server.ssrLoadModule('/app/page.tsx');
  const html=renderToStaticMarkup(React.createElement(Trial));
  assert.equal((html.match(/class="trial-stop"/g)||[]).length,4);
  assert(html.includes('All saved places')&&html.includes('Trip plan'));
  assert(html.includes('not verified addresses'));
  assert(!html.includes('Secure the return.'));
  assert(!html.includes('class="map-frame"'));
  const plan=renderToStaticMarkup(React.createElement(Home,{planningOnly:true}));
  assert(plan.includes('Secure the return.'));
  assert(plan.includes('CAPTION KABUTOCHO'));
  assert(!plan.includes('id="places"'));
  assert(!plan.includes('<main'));
  console.log('Trial checks passed: four varied saved stops, untouched data, clear uncertainty, optional map, separate planning.');
} finally {await server.close()}
