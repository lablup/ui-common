import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./CheckboxInput-CqTkQoR-.js";import{r as i,t as a}from"./helpers-BumIgWzl.js";import{n as o,t as s}from"./Form-Dk-rNlbs.js";function c(e){let[t,n]=i(e.value===!0);return(0,l.jsx)(r,{...e,value:t,onChange:(t,r)=>{n(t),e.onChange?.(t,r)}})}var l,u,d,f,p,m,h,g,_,v;function y(){return(y=e((()=>{o(),n(),a(),l=t(),{fn:u}=__STORYBOOK_MODULE_TEST__,d={title:`Forks/CheckboxInput`,component:r,args:{label:`Accept terms`,value:!1,onChange:u()},argTypes:{size:{control:`inline-radio`,options:[`sm`,`md`]}},render:e=>(0,l.jsx)(c,{...e})},f={},p={args:{value:!0}},m={args:{description:`You can withdraw at any time.`}},h={args:{isDisabled:!0}},g={args:{status:{type:`error`,message:`Required.`}}},_={render:e=>(0,l.jsx)(s,{layout:`vertical`,initialValues:{flag:!1},children:(0,l.jsx)(s.Item,{label:`Accept terms`,name:`flag`,valuePropName:`value`,children:(0,l.jsx)(r,{...e,isLabelHidden:!0,value:!1})})})},v=[`Default`,`On`,`WithDescription`,`Disabled`,`WithStatus`,`InFormItem`],f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{}`,...f.parameters?.docs?.source}}},p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    value: true
  }
}`,...p.parameters?.docs?.source}}},m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    description: "You can withdraw at any time."
  }
}`,...m.parameters?.docs?.source}}},h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  args: {
    isDisabled: true
  }
}`,...h.parameters?.docs?.source}}},g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  args: {
    status: {
      type: "error",
      message: "Required."
    }
  }
}`,...g.parameters?.docs?.source}}},_.parameters={..._.parameters,docs:{..._.parameters?.docs,source:{originalSource:`{
  render: args => <Form layout="vertical" initialValues={{
    flag: false
  }}>
      <Form.Item label="Accept terms" name="flag" valuePropName="value">
        <CheckboxInput {...args} isLabelHidden value={false} />
      </Form.Item>
    </Form>
}`,..._.parameters?.docs?.source},description:{story:"The fork's fix: a passed `id` reaches the native checkbox, so the\n`Form.Item` label names the control, and clicking it toggles the control.",..._.parameters?.docs?.description}}}})))()}y();export{f as Default,h as Disabled,_ as InFormItem,p as On,m as WithDescription,g as WithStatus,v as __namedExportsOrder,d as default};