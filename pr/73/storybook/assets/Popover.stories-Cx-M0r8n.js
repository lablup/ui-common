import{n as e}from"./rolldown-runtime-DkW27tQK.js";import{t}from"./jsx-runtime-DeHZSEgm.js";import{n,t as r}from"./Button-CAzn-Iqu.js";import{n as i,t as a}from"./Popover-DFd6SIjH.js";import{c as o,u as s}from"./context-OrO53_6r.js";import{i as c,n as l,t as u}from"./helpers-BumIgWzl.js";import{o as d,s as f}from"./formControl-smyMC-9h.js";import{n as p,t as m}from"./TextInput-z97KVJHj.js";function h({content:e,...t}){return(0,g.jsx)(a,{...t,content:(0,g.jsx)(o,{children:e})})}var g;function _(){return(_=e((()=>{i(),s(),g=t();try{h.displayName=`Popover`,h.__docgenInfo={description:``,displayName:`Popover`,filePath:`/home/runner/work/ui-common/ui-common/src/components/Popover/Popover.tsx`,methods:[],props:{},tags:{}}}catch{}})))()}var v,y,b,x,S,C;function w(){return(w=e((()=>{n(),f(),p(),_(),u(),v=t(),{fn:y}=__STORYBOOK_MODULE_TEST__,b={title:`Components/Popover`,component:h,args:{label:`Filter`,isOpen:!0,onOpenChange:y(),content:(0,v.jsx)(m,{"aria-label":`Search users`,placeholder:`Search users`}),children:(0,v.jsx)(r,{label:`Filter`})},argTypes:{content:{control:!1},children:{control:!1}},parameters:l(`320px`),render:function(e){let[t,n]=c(e.isOpen,t=>e.onOpenChange?.(t));return(0,v.jsx)(h,{...e,isOpen:t,onOpenChange:n})},parameters:{docs:{description:{component:"Astryx's Popover with one difference: its content is not part of the\n`Form.Item` it opens from. In `InFormItem`, submit the form empty: the item\nshows its error, and the search field inside the popover stays clean."}}}},x={},S={render:function(e){let[t,n]=c(e.isOpen,t=>e.onOpenChange?.(t));return(0,v.jsxs)(d,{layout:`vertical`,style:{maxWidth:400},children:[(0,v.jsx)(d.Item,{label:`Owner`,name:`owner`,rules:[{required:!0,message:`Pick an owner.`}],children:(0,v.jsx)(h,{...e,isOpen:t,onOpenChange:n})}),(0,v.jsx)(r,{type:`submit`,variant:`primary`,label:`Submit`})]})}},C=[`Default`,`InFormItem`],x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{}`,...x.parameters?.docs?.source}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  render: function Render(args) {
    const [isOpen, setOpen] = useOpenState(args.isOpen, next => args.onOpenChange?.(next));
    return <Form layout="vertical" style={{
      maxWidth: 400
    }}>
        <Form.Item label="Owner" name="owner" rules={[{
        required: true,
        message: "Pick an owner."
      }]}>
          <Popover {...args} isOpen={isOpen} onOpenChange={setOpen} />
        </Form.Item>
        <Button type="submit" variant="primary" label="Submit" />
      </Form>;
  }
}`,...S.parameters?.docs?.source}}}})))()}w();export{x as Default,S as InFormItem,C as __namedExportsOrder,b as default};