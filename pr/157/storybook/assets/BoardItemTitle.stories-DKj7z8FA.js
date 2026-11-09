import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./Button-keUK_k3N.js";import{a as i,t as a}from"./helpers-BumIgWzl.js";import{n as o,t as s}from"./BoardItemTitle-DkpMqkmC.js";var c,l,u,d,f,p,m,h,g;function _(){return(_=e((()=>{n(),o(),a(),c=t(),{fn:l}=__STORYBOOK_MODULE_TEST__,u={title:`Components/BoardItemTitle`,component:s,argTypes:{endContent:{control:!1}},args:{title:`Active sessions`}},d={},f={args:{tooltip:`Counts only sessions that are running now.`}},p={args:{tooltip:`Counts only sessions that are running now.`,endContent:(0,c.jsx)(r,{label:`Refresh`,size:`sm`,onClick:l()})}},m={args:{title:`Resource usage by project`,tooltip:`Updated every minute.`,endContent:(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(r,{label:`Export`,size:`sm`}),(0,c.jsx)(r,{label:`Refresh`,size:`sm`})]})},decorators:[i(260)]},h={args:{title:`Create a new storage folder for this project`,tooltip:`Updated every minute.`},decorators:[i(160)]},g=[`Default`,`WithTooltip`,`WithActions`,`Narrow`,`LongTitle`],d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    tooltip: "Counts only sessions that are running now."
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    tooltip: "Counts only sessions that are running now.",
    endContent: <Button label="Refresh" size="sm" onClick={fn()} />
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Resource usage by project",
    tooltip: "Updated every minute.",
    endContent: <>
        <Button label="Export" size="sm" />
        <Button label="Refresh" size="sm" />
      </>
  },
  decorators: [withMaxWidth(260)]
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Create a new storage folder for this project",
    tooltip: "Updated every minute."
  },
  decorators: [withMaxWidth(160)]
}`,...h.parameters?.docs?.source},description:{story:`A title wider than the row wraps at word boundaries instead of overflowing.`,...h.parameters?.docs?.description}}}})))()}_();export{d as Default,h as LongTitle,m as Narrow,p as WithActions,f as WithTooltip,g as __namedExportsOrder,u as default};