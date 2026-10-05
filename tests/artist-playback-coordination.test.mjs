import test from 'node:test';import assert from 'node:assert/strict';import React from 'react';import {loadSource} from './load-source.mjs';
test('YouTube and MP3 coordinate playback and ignore events from a retired player',async()=>{
 const effects=[],refs=[];let hook=0,pauses=0,videoPauses=0,events,destroyed=0;
 const react={...React,useState:value=>{const initial=hook++===2?'https://example.test':value;return[initial,()=>{}];},useEffect:fn=>effects.push(fn),useRef:value=>{const ref={current:value};refs.push(ref);return ref;}};
 const api={Player:class{constructor(frame,options){events=options.events;}pauseVideo(){videoPauses++;}destroy(){destroyed++;}}};
 const component=loadSource('src/components/artist/YouTubeGallery.tsx',{'react':react,'@/lib/youtube-iframe':{loadYouTubeApi:async()=>api},'../audio/AudioContext':{useAudio:()=>({pauseTrack:()=>pauses++,isPlaying:true})}});
 component.YouTubeGallery({stageName:'Artist',videos:[{id:'video',youtubeUrl:'https://youtu.be/omnvXEdvgbI'}]});refs[0].current={};
 const clean=effects[2]();await Promise.resolve();events.onStateChange({data:1});assert.equal(pauses,1);events.onReady();assert.equal(videoPauses,1);clean();events.onStateChange({data:1});assert.equal(pauses,1);assert.equal(destroyed,1);
});
