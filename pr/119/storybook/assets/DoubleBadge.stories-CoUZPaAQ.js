import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./HStack-LbxorLrZ.js";import{n as i,t as a}from"./Badge-D0xxXWiQ.js";function o({values:e=[]}){if(e.length===0)return null;let t=e.map(e=>typeof e==`string`?{label:e,variant:`neutral`}:e);return(0,s.jsx)(r,{gap:0,align:`center`,className:`uic-double-badge`,children:t.map((e,t)=>e.label?(0,s.jsx)(a,{className:`uic-double-badge__item`,variant:e.variant??`neutral`,label:e.label},t):null)})}var s;function c(){return(c=e((()=>{i(),n(),s=t(),o.displayName=`DoubleBadge`;try{o.displayName=`DoubleBadge`,o.__docgenInfo={description:``,displayName:`DoubleBadge`,filePath:`/home/runner/work/ui-common/ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,methods:[],props:{values:{defaultValue:{value:`[]`},declarations:[{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`}],description:`The badges, in order.`,name:`values`,parent:{fileName:`ui-common/src/components/DoubleBadge/DoubleBadge.tsx`,name:`DoubleBadgeProps`},required:!1,tags:{},type:{name:`(string | DoubleBadgeValue)[]`}}},tags:{}}}catch{}})))()}var l,u,d,f,p,m,h,g,_;function v(){return(v=e((()=>{c(),l=t(),u={title:`Components/DoubleBadge`,component:o,args:{values:[{label:`RUNNING`,variant:`success`},`2m`]}},d={},f={render:()=>(0,l.jsx)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[`neutral`,`info`,`success`,`warning`,`error`].map(e=>(0,l.jsx)(o,{values:[{label:e.toUpperCase(),variant:e},`5m`]},e))})},p={render:()=>(0,l.jsxs)(`div`,{style:{display:`grid`,gap:8,justifyItems:`start`},children:[(0,l.jsx)(o,{values:[`Draft`,`Draft`]}),(0,l.jsx)(o,{values:[{label:`PENDING`,variant:`warning`},{label:`Queued`,variant:`warning`}]})]})},m={args:{values:[{label:`PENDING`,variant:`warning`},{label:`Queued`,variant:`info`},`12s`]}},h={args:{values:[`Draft`]}},g={render:()=>(0,l.jsxs)(`div`,{className:`uic-story-tinted-badges`,style:{display:`grid`,gap:8,justifyItems:`start`},children:[[`neutral`,`info`,`success`,`warning`,`error`].map(e=>(0,l.jsx)(o,{values:[{label:e.toUpperCase(),variant:e},`5m`]},e)),(0,l.jsx)(o,{values:[`Draft`,`Draft`]}),(0,l.jsx)(o,{values:[{label:`Paused`,variant:`warning`},{label:`Set by user`}]}),(0,l.jsx)(o,{values:[`Agent`,{label:`26.10.0a4`,variant:`success`}]})]})},_=[`Default`,`Variants`,`SameVariant`,`ThreeValues`,`Single`,`TintedTheme`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
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
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
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
}`,...p.parameters?.docs?.source},description:{story:`Badges of one variant: the divider keeps them apart.`,...p.parameters?.docs?.description}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    values: [{
      label: "PENDING",
      variant: "warning"
    }, {
      label: "Queued",
      variant: "info"
    }, "12s"]
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    values: ["Draft"]
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: () => <div className="uic-story-tinted-badges" style={{
    display: "grid",
    gap: 8,
    justifyItems: "start"
  }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map(variant => <DoubleBadge key={variant} values={[{
      label: variant.toUpperCase(),
      variant
    }, "5m"]} />)}
      <DoubleBadge values={["Draft", "Draft"]} />
      <DoubleBadge values={[{
      label: "Paused",
      variant: "warning"
    }, {
      label: "Set by user"
    }]} />
      <DoubleBadge values={["Agent", {
      label: "26.10.0a4",
      variant: "success"
    }]} />
    </div>
}`,...g.parameters?.docs?.source},description:{story:`Under a theme that tints and outlines badges (light fill, 1px outline, dark
text, as Backend.AI WebUI does): the divider takes the outline's place on
the shared column, in the colour of the coloured neighbour's outline.`,...g.parameters?.docs?.description}}}})))()}v();export{d as Default,p as SameVariant,h as Single,m as ThreeValues,g as TintedTheme,f as Variants,_ as __namedExportsOrder,u as default};