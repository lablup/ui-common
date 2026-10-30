import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{a as t,d as n,i as r,n as i,o as a,r as o,t as s,u as c}from"./lablup-fHYKai7v.js";import{t as l}from"./jsx-runtime-DeHZSEgm.js";import{a as u,o as d}from"./useTheme-Qcq7umOR.js";import{n as f,t as p}from"./HStack-LbxorLrZ.js";import{n as m,t as h}from"./Badge-D0xxXWiQ.js";function g({values:e=[]}){if(e.length===0)return null;let t=e.map(e=>typeof e==`string`?{label:e,variant:`neutral`}:e);return(0,_.jsx)(p,{gap:0,align:`center`,className:`uic-double-badge`,children:t.map((e,t)=>e.label?(0,_.jsx)(h,{className:`uic-double-badge__item`,variant:e.variant??`neutral`,label:e.label},t):null)})}var _;function v(){return(v=e((()=>{m(),f(),_=l(),g.displayName=`DoubleBadge`;try{g.displayName=`DoubleBadge`,g.__docgenInfo={description:``,displayName:`DoubleBadge`,filePath:`/home/runner/work/ui-common/ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,methods:[],props:{values:{defaultValue:{value:`[]`},declarations:[{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`}],description:`The badges, in order.`,name:`values`,parent:{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`},required:!1,tags:{},type:{name:`(string | DoubleBadgeValue)[]`}}},tags:{}}}catch{}})))()}function y({themeStyle:e}){let r=n();return(0,b.jsx)(t,{theme:k[e],mode:r?`dark`:`light`,children:(0,b.jsxs)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[[`neutral`,`info`,`success`,`warning`,`error`].map(e=>(0,b.jsx)(g,{values:[{label:e.toUpperCase(),variant:e},`5m`]},e)),(0,b.jsx)(g,{values:[`Draft`,`Draft`]}),(0,b.jsx)(g,{values:[{label:`Paused`,variant:`warning`},{label:`Set by user`}]}),(0,b.jsx)(g,{values:[`Agent`,{label:`26.10.0a4`,variant:`success`}]})]})})}var b,x,S,C,w,T,E,D,O,k,A,j;function M(){return(M=e((()=>{c(),d(),a(),o(),s(),v(),b=l(),x={title:`Components/DoubleBadge`,component:g,args:{values:[{label:`RUNNING`,variant:`success`},`2m`]}},S={},C={render:()=>(0,b.jsx)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[`neutral`,`info`,`success`,`warning`,`error`].map(e=>(0,b.jsx)(g,{values:[{label:e.toUpperCase(),variant:e},`5m`]},e))})},w={render:()=>(0,b.jsxs)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[(0,b.jsx)(g,{values:[`Draft`,`Draft`]}),(0,b.jsx)(g,{values:[{label:`PENDING`,variant:`warning`},{label:`Queued`,variant:`warning`}]})]})},T={args:{values:[{label:`PENDING`,variant:`warning`},{label:`Queued`,variant:`info`},`12s`]}},E={args:{values:[`Draft`]}},D=e=>`inset 0 0 0 var(--border-width) ${e}`,O={badge:{"variant:neutral":{boxShadow:D(`var(--double-badge-divider, var(--color-border-emphasized))`)},...Object.fromEntries([[`info`,`blue`],[`success`,`green`],[`warning`,`yellow`],[`error`,`red`]].map(([e,t])=>[`variant:${e}`,{backgroundColor:`var(--color-background-${t})`,color:`var(--color-text-${t})`,boxShadow:D(`var(--color-border-${t})`)}]))}},k={lablup:u({name:`lablup-tinted-badges`,extends:i,components:O}),neutral:u({name:`neutral-tinted-badges`,extends:r,components:O})},A={render:(e,{globals:t})=>(0,b.jsx)(y,{themeStyle:t.themeStyle===`neutral`?`neutral`:`lablup`})},j=[`Default`,`Variants`,`SameVariant`,`ThreeValues`,`Single`,`TintedTheme`],S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gap: 8,
    justifyItems: "start"
  }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map(variant => <DoubleBadge key={variant} values={[{
      label: variant.toUpperCase(),
      variant
    }, "5m"]} />)}
    </div>
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: "grid",
    gap: 8,
    justifyItems: "start"
  }}>
      <DoubleBadge values={["Draft", "Draft"]} />
      <DoubleBadge values={[{
      label: "PENDING",
      variant: "warning"
    }, {
      label: "Queued",
      variant: "warning"
    }]} />
    </div>
}`,...w.parameters?.docs?.source},description:{story:`Badges of one variant: the divider keeps them apart.`,...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "PENDING",
      variant: "warning"
    }, {
      label: "Queued",
      variant: "info"
    }, "12s"]
  }
}`,...T.parameters?.docs?.source}}},E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  args: {
    values: ["Draft"]
  }
}`,...E.parameters?.docs?.source}}},A.parameters={...A.parameters,docs:{...A.parameters?.docs,source:{originalSource:`{
  render: (_args, {
    globals
  }) => <TintedBadges themeStyle={globals.themeStyle === "neutral" ? "neutral" : "lablup"} />
}`,...A.parameters?.docs?.source},description:{story:`Under a theme that tints and outlines badges (light fill, 1px outline, dark
text, as Backend.AI WebUI does): the divider takes the outline's place on
the shared column, in the colour of the coloured neighbour's outline.`,...A.parameters?.docs?.description}}}})))()}M();export{S as Default,w as SameVariant,E as Single,T as ThreeValues,A as TintedTheme,C as Variants,j as __namedExportsOrder,x as default};