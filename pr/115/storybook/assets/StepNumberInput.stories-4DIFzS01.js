import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{a as r,r as i,t as a}from"./helpers-BumIgWzl.js";import{n as o,t as s}from"./NumberInput-B66-vCI8.js";import{a as c,i as l,n as u,o as d,r as f,s as p,t as m}from"./StepNumberInput-D6MPJTwo.js";function h(e){let[t,n]=i(e.value??e.steps[0]??0);return(0,v.jsx)(m,{...e,value:t,onChange:t=>{n(t),e.onChange?.(t)}})}function g(){let e=[1,2,4,8,16,32,64,128],[t,n]=(0,_.useState)(8);return(0,v.jsxs)(d,{label:`Batch size`,children:[(0,v.jsx)(s,{label:`Batch size`,isLabelHidden:!0,value:t,onChange:n,width:`100%`}),(0,v.jsx)(f,{onStep:r=>{let i=l(e,t??0,r),a=e[i];a!==void 0&&n(a)}})]})}var _,v,y,b,x,S,C,w,T,E;function D(){return(D=e((()=>{_=t(),p(),o(),c(),u(),a(),v=n(),{fn:y}=__STORYBOOK_MODULE_TEST__,b=[.25,.5,1,2,4,8,16],x={title:`Components/StepNumberInput`,component:m,subcomponents:{NumberStepper:f},args:{label:`Shared memory`,steps:b,value:1,units:`GiB`,onChange:y()},decorators:[r(240)],render:e=>(0,v.jsx)(h,{...e})},S={},C={args:{min:.5,max:8,value:2}},w={args:{isDisabled:!0}},T={render:()=>(0,v.jsx)(g,{})},E=[`Default`,`WithMinMax`,`Disabled`,`Stepper`],S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{}`,...S.parameters?.docs?.source}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    min: 0.5,
    max: 8,
    value: 2
  }
}`,...C.parameters?.docs?.source}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    isDisabled: true
  }
}`,...w.parameters?.docs?.source}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <PowerOfTwoField />
}`,...T.parameters?.docs?.source}}}})))()}D();export{S as Default,w as Disabled,T as Stepper,C as WithMinMax,E as __namedExportsOrder,x as default};