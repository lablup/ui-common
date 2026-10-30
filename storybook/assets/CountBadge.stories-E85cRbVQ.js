import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./createLucideIcon-CFOFi7Up.js";import{n as i,t as a}from"./IconButton-5z0YBzul.js";import{n as o,t as s}from"./Badge-D0xxXWiQ.js";var c,l;function u(){return(u=e((()=>{n(),c={name:`bell`,size:24,node:[[`path`,{d:`M10.268 21a2 2 0 0 0 3.464 0`,key:`vwvbt9`}],[`path`,{d:`M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326`,key:`11g9vi`}]]},c.node,l=r(c)})))()}function d({count:e,hasDot:t=!1,max:n=99,isZeroShown:r=!1,offset:i,size:a=`md`,label:o,variant:c,children:l,className:u,style:d,...p}){let m=typeof e==`number`,h=!t&&(e==null||m&&e===0&&!r),g=m&&e>n?`${n}+`:e;return(0,f.jsxs)(`span`,{className:[`uic-count-badge`,u].filter(Boolean).join(` `),style:d,children:[l,h?null:(0,f.jsx)(`span`,{className:[`uic-count-badge__overlay`,a===`sm`?`uic-count-badge__overlay--sm`:``].filter(Boolean).join(` `),style:{"--count-badge-offset-x":`${i?.[0]??0}px`,"--count-badge-offset-y":`${i?.[1]??0}px`},role:`status`,"aria-label":o,children:t?(0,f.jsx)(`span`,{className:`uic-count-badge__dot`,"data-variant":c??`neutral`}):(0,f.jsx)(s,{...p,className:`uic-count-badge__pill`,variant:c,label:g})})]})}var f;function p(){return(p=e((()=>{o(),f=t(),d.displayName=`CountBadge`;try{d.displayName=`CountBadge`,d.__docgenInfo={description:``,displayName:`CountBadge`,filePath:`/home/runner/work/ui-common/ui-common/src/components/CountBadge/CountBadge.tsx`,methods:[],props:{count:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:`The number, or node, shown in the overlay.`,name:`count`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{},type:{name:`ReactNode`}},hasDot:{defaultValue:{value:`false`},declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:`Render a bare dot instead of the count.`,name:`hasDot`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{default:`false`},type:{name:`boolean`}},max:{defaultValue:{value:`99`},declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:"A numeric count above this renders as `${max}+`.",name:`max`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{default:`99`},type:{name:`number`}},isZeroShown:{defaultValue:{value:`false`},declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:"Keep the overlay when `count` is 0.",name:`isZeroShown`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{default:`false`},type:{name:`boolean`}},offset:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:"`[x, y]` pixel nudge of the overlay: +x moves it right, +y down.",name:`offset`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{},type:{name:`[number, number]`}},size:{defaultValue:{value:`md`},declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:"`sm` is a denser pill for tab rails and table headers.",name:`size`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{default:`'md'`},type:{name:`enum`,raw:`"sm" | "md"`,value:[{value:`"sm"`},{value:`"md"`}]}},label:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:`Accessible name of the overlay, e.g. "3 unread notifications".`,name:`label`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{},type:{name:`string`}},children:{defaultValue:null,declarations:[{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`}],description:`The element the overlay is anchored to.`,name:`children`,parent:{fileName:`ui-common/src/components/CountBadge/CountBadge.tsx`,name:`CountBadgeProps`},required:!1,tags:{},type:{name:`ReactNode`}}},tags:{}}}catch{}})))()}var m,h,g,_,v,y,b,x,S,C,w;function T(){return(T=e((()=>{u(),i(),p(),m=t(),h={title:`Components/CountBadge`,component:d,args:{count:3,label:`3 unread notifications`,variant:`error`,children:(0,m.jsx)(a,{label:`Notifications`,icon:(0,m.jsx)(l,{size:16})})},argTypes:{children:{control:!1},size:{control:`inline-radio`,options:[`sm`,`md`]},variant:{control:`select`,options:[`neutral`,`info`,`success`,`warning`,`error`]}}},g={},_={args:{count:250,label:`More than 99 unread notifications`}},v={args:{count:12,max:9,label:`More than 9 unread notifications`}},y={args:{hasDot:!0,label:`New notifications`}},b={render:e=>(0,m.jsxs)(`div`,{style:{display:`flex`,gap:24,alignItems:`center`},children:[(0,m.jsx)(d,{...e,count:0,label:`No unread notifications`}),(0,m.jsx)(d,{...e,count:0,isZeroShown:!0,label:`No unread notifications`})]})},x={render:e=>(0,m.jsx)(`div`,{style:{display:`flex`,gap:24,alignItems:`center`},children:[`md`,`sm`].map(t=>(0,m.jsx)(d,{...e,size:t},t))})},S={render:e=>(0,m.jsx)(`div`,{style:{display:`flex`,gap:24,alignItems:`center`},children:[`neutral`,`info`,`success`,`warning`,`error`].map(t=>(0,m.jsx)(d,{...e,variant:t},t))})},C={args:{offset:[4,-4]}},w=[`Default`,`OverMax`,`CustomMax`,`Dot`,`Zero`,`Sizes`,`Variants`,`WithOffset`],g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  args: {
    count: 250,
    label: "More than 99 unread notifications"
  }
}`,..._.parameters?.docs?.source}}},v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    count: 12,
    max: 9,
    label: "More than 9 unread notifications"
  }
}`,...v.parameters?.docs?.source}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    hasDot: true,
    label: "New notifications"
  }
}`,...y.parameters?.docs?.source}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "flex",
    gap: 24,
    alignItems: "center"
  }}>
      <CountBadge {...args} count={0} label="No unread notifications" />
      <CountBadge {...args} count={0} isZeroShown label="No unread notifications" />
    </div>
}`,...b.parameters?.docs?.source}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "flex",
    gap: 24,
    alignItems: "center"
  }}>
      {(["md", "sm"] as const).map(size => <CountBadge key={size} {...args} size={size} />)}
    </div>
}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "flex",
    gap: 24,
    alignItems: "center"
  }}>
      {(["neutral", "info", "success", "warning", "error"] as const).map(variant => <CountBadge key={variant} {...args} variant={variant} />)}
    </div>
}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    offset: [4, -4]
  }
}`,...C.parameters?.docs?.source}}}})))()}T();export{v as CustomMax,g as Default,y as Dot,_ as OverMax,x as Sizes,S as Variants,C as WithOffset,b as Zero,w as __namedExportsOrder,h as default};