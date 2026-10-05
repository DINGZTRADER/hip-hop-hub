import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {loadSource} from './load-source.mjs';

function hooks(){const values=[],effects=[];let cursor=0;return {react:{...React,useRef:initial=>{const i=cursor++;return values[i]??=( {current:initial} );},useState:initial=>{const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],value=>{values[i]=typeof value==='function'?value(values[i]):value;}];},useEffect:(fn,deps)=>{const i=cursor++;if(!values[i]||deps.some((value,j)=>value!==values[i][j])){values[i]=deps;effects.push(fn);}}},render:fn=>{cursor=0;return fn();},flush:()=>{while(effects.length)effects.shift()();}};}
function find(node,predicate){if(!node)return;if(Array.isArray(node)){for(const child of node){const found=find(child,predicate);if(found)return found;}return;}if(predicate(node))return node;return find(node.props?.children,predicate);}
test('image completion preserves newer fields and removal releases the owned draft',async()=>{
 const h=hooks();const calls=[];const originalFetch=global.fetch;global.fetch=async(url,options)=>{calls.push([url,JSON.parse(options.body)]);return {ok:true};};
 try{const c=loadSource('src/components/artist/ArtistProfileEditor.tsx',{react:h.react});let draft=c.emptyArtistProfileDraft();const render=()=>h.render(()=>c.ArtistProfileEditor({value:draft,onChange:value=>draft=value,onBusyChange:()=>{},onError:()=>{}}));
 const initial=render();const upload=find(initial,node=>node.props?.purpose==='portrait');draft={...draft,bio:'Latest bio',websiteUrl:'https://new.test'};render();upload.props.onUploaded({id:'draft-image',url:'/image',purpose:'portrait'});assert.equal(draft.bio,'Latest bio');assert.equal(draft.websiteUrl,'https://new.test');
 const remove=find(render(),node=>node.type==='button'&&node.props.children==='Remove portrait');await remove.props.onClick();assert.equal(draft.portrait,null);assert.deepEqual(calls,[['/api/artist-images',{id:'draft-image'}]]);
 }finally{global.fetch=originalFetch;}
});
test('unrelated artist updates preserve profile edits and unchanged videos need no reconfirmation',async()=>{
 const h=hooks();let payload;const originalFetch=global.fetch;global.fetch=async(url,options)=>{payload=JSON.parse(options.body);return{ok:true,json:async()=>({artist})};};
 const artist={id:'artist',stageName:'Fixture',bio:'Saved',youtubeVideos:[{youtubeUrl:'https://youtu.be/omnvXEdvgbI',videoTitle:'Music'}]};
 try{const c=loadSource('src/components/artist/ArtistProfileManager.tsx',{react:h.react});let current=artist;const render=()=>h.render(()=>c.ArtistProfileManager({artist:current,onSaved:()=>{}}));render();h.flush();let tree=render();find(tree,node=>node.props?.value?.bio!==undefined).props.onChange({...find(tree,node=>node.props?.value?.bio!==undefined).props.value,bio:'Unsaved'});current={...artist,tracks:[{}],heroVideoMp4Url:'https://new.test/reel.mp4'};render();h.flush();tree=render();assert.equal(find(tree,node=>node.props?.value?.bio!==undefined).props.value.bio,'Unsaved');await find(tree,node=>node.type==='form').props.onSubmit({preventDefault(){}});assert.equal(payload.bio,'Unsaved');assert.equal(Object.hasOwn(payload,'youtubeVideos'),false);
 }finally{global.fetch=originalFetch;}
});
