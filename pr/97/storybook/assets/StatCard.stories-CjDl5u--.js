import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./StatCard-CxpwcR3-.js";import{a as i,t as a}from"./helpers-BumIgWzl.js";var o,s,c,l,u,d,f,p,m;function h(){return(h=e((()=>{n(),a(),o=t(),s={title:`Components/StatCard`,component:r,args:{label:`Active sessions`,value:1284},argTypes:{tone:{control:`select`,options:[`default`,`success`,`warning`,`danger`,`info`]},emphasis:{control:`inline-radio`,options:[`compact`,`default`,`prominent`]}},decorators:[i(280)]},c={},l={args:{label:`GPUs in use`,value:3,valueSuffix:`/ 4`,hint:`Across 2 nodes`}},u={args:{trend:{direction:`up`,label:`+12%`,ariaLabel:`Up 12 percent`}}},d={render:e=>(0,o.jsx)(`div`,{style:{display:`grid`,gap:12},children:[`default`,`success`,`warning`,`danger`,`info`].map(t=>(0,o.jsx)(r,{...e,label:t,tone:t},t))})},f={args:{loading:!0}},p={args:{animate:`digits`}},m=[`Default`,`WithSuffixAndHint`,`WithTrend`,`Tones`,`Loading`,`AnimatedDigits`],c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{}`,...c.parameters?.docs?.source}}},l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    label: "GPUs in use",
    value: 3,
    valueSuffix: "/ 4",
    hint: "Across 2 nodes"
  }
}`,...l.parameters?.docs?.source}}},u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    trend: {
      direction: "up",
      label: "+12%",
      ariaLabel: "Up 12 percent"
    }
  }
}`,...u.parameters?.docs?.source}}},d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: args => <div style={{
    display: "grid",
    gap: 12
  }}>
      {(["default", "success", "warning", "danger", "info"] as const).map(tone => <StatCard key={tone} {...args} label={tone} tone={tone} />)}
    </div>
}`,...d.parameters?.docs?.source}}},f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    loading: true
  }
}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    animate: "digits"
  }
}`,...p.parameters?.docs?.source}}}})))()}h();export{p as AnimatedDigits,c as Default,f as Loading,d as Tones,l as WithSuffixAndHint,u as WithTrend,m as __namedExportsOrder,s as default};