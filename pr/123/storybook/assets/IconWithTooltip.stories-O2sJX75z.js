import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./circle-alert-CMrRrCy_.js";import{n as i,t as a}from"./circle-question-mark-0kx6XT49.js";import{n as o,t as s}from"./info-C8d40Wtd.js";import{n as c,t as l}from"./IconWithTooltip-D0eCvh-J.js";var u,d,f,p,m,h,g,_,v;function y(){return(y=e((()=>{n(),i(),o(),c(),u=t(),{fn:d}=__STORYBOOK_MODULE_TEST__,f={title:`Components/IconWithTooltip`,component:l,args:{icon:(0,u.jsx)(a,{size:16}),content:`Counts only running sessions.`,onOpenChange:d()},argTypes:{content:{control:!1},icon:{control:!1},placement:{control:`select`,options:[`above`,`below`,`start`,`end`]}},decorators:[e=>(0,u.jsx)(`div`,{style:{padding:48},children:(0,u.jsx)(e,{})})]},p={},m={args:{isDefaultOpen:!0}},h={args:{focusable:!1}},g={args:{icon:(0,u.jsx)(s,{size:16}),content:(0,u.jsxs)(`span`,{children:[`Usage is sampled every `,(0,u.jsx)(`strong`,{children:`5 minutes`}),`.`]})}},_={render:e=>(0,u.jsxs)(`span`,{style:{display:`inline-flex`,gap:4,alignItems:`center`},children:[`Quota exceeded`,(0,u.jsx)(l,{...e,icon:(0,u.jsx)(r,{size:14}),content:`Remove unused files to free up space.`})]})},v=[`Default`,`Open`,`NotFocusable`,`RichContent`,`InlineWithText`],p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    isDefaultOpen: true
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    focusable: false
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    icon: <Info size={16} />,
    content: <span>
        Usage is sampled every <strong>5 minutes</strong>.
      </span>
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: args => <span style={{
    display: "inline-flex",
    gap: 4,
    alignItems: "center"
  }}>
      Quota exceeded
      <IconWithTooltip {...args} icon={<CircleAlert size={14} />} content="Remove unused files to free up space." />
    </span>
}`,..._.parameters?.docs?.source}}}})))()}y();export{p as Default,_ as InlineWithText,h as NotFocusable,m as Open,g as RichContent,v as __namedExportsOrder,f as default};