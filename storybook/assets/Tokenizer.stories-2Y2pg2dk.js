import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./react-BZJXY1be.js";import{t as n}from"./jsx-runtime-DeHZSEgm.js";import{n as r,t as i}from"./Tokenizer-DiXHRopO.js";import{a,t as o}from"./helpers-BumIgWzl.js";import{i as s,n as c,r as l,t as u}from"./formControlStories-NgMfexbv.js";import{t as d}from"./createStaticSource-Cfz9LMai.js";var f,p,m,h,g,_,v,y,b,x,S,C,w,T,E;function D(){return(D=e((()=>{f=t(),r(),s(),o(),p=n(),{fn:m}=__STORYBOOK_MODULE_TEST__,h=[{id:`ada`,label:`Ada Lovelace`},{id:`alan`,label:`Alan Turing`}],g=d(h),_={title:`Form Controls/Tokenizer`,component:i,args:{"aria-label":`Members`,searchSource:g,placeholder:`Add people`,onChange:m()},argTypes:{status:{control:`inline-radio`,options:[``,`warning`,`error`]}},decorators:[a(400)],parameters:{docs:{description:{component:"Tokenizer on its own and inside `Form.Item`. On its own it is named by\n`aria-label` and, without `value`, keeps its own state, as antd's\ncontrols do. Inside an item, the item owns the label, the help text and the\nmessage, and supplies the value (src/formControls)."}}}},v={},y={render:function(e){let[t,n]=(0,f.useState)([h[0]]);return(0,p.jsxs)(p.Fragment,{children:[(0,p.jsx)(i,{...e,value:t,onChange:e=>n(e)}),(0,p.jsx)(l,{value:t})]})}},b={render:e=>(0,p.jsx)(c,{render:t=>(0,p.jsx)(i,{...e,"aria-label":`Members (${t})`,status:t})})},x={args:{disabled:!0}},S={render:()=>(0,p.jsx)(u,{label:`Members`,children:(0,p.jsx)(i,{searchSource:g,placeholder:`Add people`})})},C={render:()=>(0,p.jsx)(u,{label:`Members`,initialValue:[h[0]],children:(0,p.jsx)(i,{searchSource:g,placeholder:`Add people`})})},w={render:()=>(0,p.jsx)(u,{label:`Members`,validateTrigger:`onBlur`,children:(0,p.jsx)(i,{searchSource:g,placeholder:`Add people`})})},T={render:()=>(0,p.jsx)(u,{label:`Members`,disabled:!0,initialValue:[h[0]],children:(0,p.jsx)(i,{searchSource:g,placeholder:`Add people`})})},E=[`Default`,`Controlled`,`Statuses`,`Disabled`,`InFormItem`,`InFormItemWithValue`,`ValidateOnBlur`,`FormDisabled`],v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{}`,...v.parameters?.docs?.source},description:{story:"On its own and uncontrolled: no `value`, so it keeps what the user enters.",...v.parameters?.docs?.description}}},y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [value, setValue] = useState<SearchableItem[] | undefined>([PEOPLE[0]!]);
    return <>
        <Tokenizer {...args} value={value} onChange={next => setValue(next)} />
        <ValueReadout value={value} />
      </>;
  }
}`,...y.parameters?.docs?.source},description:{story:"On its own and controlled, through `value` and `onChange`.",...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:"{\n  render: args => <StatusesDemo render={status => <Tokenizer {...args} aria-label={`Members (${status})`} status={status} />} />\n}",...b.parameters?.docs?.source},description:{story:"On its own with a border status, antd's `status`: no message.",...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true
  }
}`,...x.parameters?.docs?.source},description:{story:`On its own, disabled.`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Members">
      <Tokenizer searchSource={source} placeholder="Add people" />
    </FormItemDemo>
}`,...S.parameters?.docs?.source},description:{story:"Inside a `Form.Item`: the item's label names the control, and a required\nrule shows its one message when the form is submitted empty.",...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Members" initialValue={[PEOPLE[0]]}>
      <Tokenizer searchSource={source} placeholder="Add people" />
    </FormItemDemo>
}`,...C.parameters?.docs?.source},description:{story:"Inside a `Form.Item`, starting from the form's `initialValues`. Reset puts\nthe value back.",...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Members" validateTrigger="onBlur">
      <Tokenizer searchSource={source} placeholder="Add people" />
    </FormItemDemo>
}`,...w.parameters?.docs?.source},description:{story:'Inside a `Form.Item` that validates when focus leaves the control\n(`validateTrigger="onBlur"`), not while it is edited: empty the field,\nthen move focus away to see the message. `InFormItem` validates on change.',...w.parameters?.docs?.description}}},T.parameters={...T.parameters,docs:{...T.parameters?.docs,source:{originalSource:`{
  render: () => <FormItemDemo label="Members" disabled initialValue={[PEOPLE[0]]}>
      <Tokenizer searchSource={source} placeholder="Add people" />
    </FormItemDemo>
}`,...T.parameters?.docs?.source},description:{story:"Inside a disabled form: `<Form disabled>` disables the control.",...T.parameters?.docs?.description}}}})))()}D();export{y as Controlled,v as Default,x as Disabled,T as FormDisabled,S as InFormItem,C as InFormItemWithValue,b as Statuses,w as ValidateOnBlur,E as __namedExportsOrder,_ as default};