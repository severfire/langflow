"use strict";(self.webpackChunklangflow_docs=self.webpackChunklangflow_docs||[]).push([[7198],{7293:(e,n,t)=>{t.d(n,{A:()=>N});var o=t(6540),s=t(4848);function i(e){const{mdxAdmonitionTitle:n,rest:t}=function(e){const n=o.Children.toArray(e),t=n.find((e=>o.isValidElement(e)&&"mdxAdmonitionTitle"===e.type)),i=n.filter((e=>e!==t)),r=t?.props.children;return{mdxAdmonitionTitle:r,rest:i.length>0?(0,s.jsx)(s.Fragment,{children:i}):null}}(e.children),i=e.title??n;return{...e,...i&&{title:i},children:t}}var r=t(8215),l=t(1312),d=t(7559);const c={admonition:"admonition_xJq3",admonitionHeading:"admonitionHeading_Gvgb",admonitionIcon:"admonitionIcon_Rf37",admonitionContent:"admonitionContent_BuS1"};function a(e){let{type:n,className:t,children:o}=e;return(0,s.jsx)("div",{className:(0,r.A)(d.G.common.admonition,d.G.common.admonitionType(n),c.admonition,t),children:o})}function h(e){let{icon:n,title:t}=e;return(0,s.jsxs)("div",{className:c.admonitionHeading,children:[(0,s.jsx)("span",{className:c.admonitionIcon,children:n}),t]})}function x(e){let{children:n}=e;return n?(0,s.jsx)("div",{className:c.admonitionContent,children:n}):null}function p(e){const{type:n,icon:t,title:o,children:i,className:r}=e;return(0,s.jsxs)(a,{type:n,className:r,children:[o||t?(0,s.jsx)(h,{title:o,icon:t}):null,(0,s.jsx)(x,{children:i})]})}function j(e){return(0,s.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",d:"M6.3 5.69a.942.942 0 0 1-.28-.7c0-.28.09-.52.28-.7.19-.18.42-.28.7-.28.28 0 .52.09.7.28.18.19.28.42.28.7 0 .28-.09.52-.28.7a1 1 0 0 1-.7.3c-.28 0-.52-.11-.7-.3zM8 7.99c-.02-.25-.11-.48-.31-.69-.2-.19-.42-.3-.69-.31H6c-.27.02-.48.13-.69.31-.2.2-.3.44-.31.69h1v3c.02.27.11.5.31.69.2.2.42.31.69.31h1c.27 0 .48-.11.69-.31.2-.19.3-.42.31-.69H8V7.98v.01zM7 2.3c-3.14 0-5.7 2.54-5.7 5.68 0 3.14 2.56 5.7 5.7 5.7s5.7-2.55 5.7-5.7c0-3.15-2.56-5.69-5.7-5.69v.01zM7 .98c3.86 0 7 3.14 7 7s-3.14 7-7 7-7-3.12-7-7 3.14-7 7-7z"})})}const u={icon:(0,s.jsx)(j,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.note",description:"The default label used for the Note admonition (:::note)",children:"note"})};function f(e){return(0,s.jsx)(p,{...u,...e,className:(0,r.A)("alert alert--secondary",e.className),children:e.children})}function m(e){return(0,s.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",d:"M6.5 0C3.48 0 1 2.19 1 5c0 .92.55 2.25 1 3 1.34 2.25 1.78 2.78 2 4v1h5v-1c.22-1.22.66-1.75 2-4 .45-.75 1-2.08 1-3 0-2.81-2.48-5-5.5-5zm3.64 7.48c-.25.44-.47.8-.67 1.11-.86 1.41-1.25 2.06-1.45 3.23-.02.05-.02.11-.02.17H5c0-.06 0-.13-.02-.17-.2-1.17-.59-1.83-1.45-3.23-.2-.31-.42-.67-.67-1.11C2.44 6.78 2 5.65 2 5c0-2.2 2.02-4 4.5-4 1.22 0 2.36.42 3.22 1.19C10.55 2.94 11 3.94 11 5c0 .66-.44 1.78-.86 2.48zM4 14h5c-.23 1.14-1.3 2-2.5 2s-2.27-.86-2.5-2z"})})}const g={icon:(0,s.jsx)(m,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.tip",description:"The default label used for the Tip admonition (:::tip)",children:"tip"})};function v(e){return(0,s.jsx)(p,{...g,...e,className:(0,r.A)("alert alert--success",e.className),children:e.children})}function y(e){return(0,s.jsx)("svg",{viewBox:"0 0 14 16",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",d:"M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"})})}const b={icon:(0,s.jsx)(y,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.info",description:"The default label used for the Info admonition (:::info)",children:"info"})};function w(e){return(0,s.jsx)(p,{...b,...e,className:(0,r.A)("alert alert--info",e.className),children:e.children})}function F(e){return(0,s.jsx)("svg",{viewBox:"0 0 16 16",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",d:"M8.893 1.5c-.183-.31-.52-.5-.887-.5s-.703.19-.886.5L.138 13.499a.98.98 0 0 0 0 1.001c.193.31.53.501.886.501h13.964c.367 0 .704-.19.877-.5a1.03 1.03 0 0 0 .01-1.002L8.893 1.5zm.133 11.497H6.987v-2.003h2.039v2.003zm0-3.004H6.987V5.987h2.039v4.006z"})})}const A={icon:(0,s.jsx)(F,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.warning",description:"The default label used for the Warning admonition (:::warning)",children:"warning"})};function k(e){return(0,s.jsx)("svg",{viewBox:"0 0 12 16",...e,children:(0,s.jsx)("path",{fillRule:"evenodd",d:"M5.05.31c.81 2.17.41 3.38-.52 4.31C3.55 5.67 1.98 6.45.9 7.98c-1.45 2.05-1.7 6.53 3.53 7.7-2.2-1.16-2.67-4.52-.3-6.61-.61 2.03.53 3.33 1.94 2.86 1.39-.47 2.3.53 2.27 1.67-.02.78-.31 1.44-1.13 1.81 3.42-.59 4.78-3.42 4.78-5.56 0-2.84-2.53-3.22-1.25-5.61-1.52.13-2.03 1.13-1.89 2.75.09 1.08-1.02 1.8-1.86 1.33-.67-.41-.66-1.19-.06-1.78C8.18 5.31 8.68 2.45 5.05.32L5.03.3l.02.01z"})})}const C={icon:(0,s.jsx)(k,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.danger",description:"The default label used for the Danger admonition (:::danger)",children:"danger"})};const L={icon:(0,s.jsx)(F,{}),title:(0,s.jsx)(l.A,{id:"theme.admonition.caution",description:"The default label used for the Caution admonition (:::caution)",children:"caution"})};const T={...{note:f,tip:v,info:w,warning:function(e){return(0,s.jsx)(p,{...A,...e,className:(0,r.A)("alert alert--warning",e.className),children:e.children})},danger:function(e){return(0,s.jsx)(p,{...C,...e,className:(0,r.A)("alert alert--danger",e.className),children:e.children})}},...{secondary:e=>(0,s.jsx)(f,{title:"secondary",...e}),important:e=>(0,s.jsx)(w,{title:"important",...e}),success:e=>(0,s.jsx)(v,{title:"success",...e}),caution:function(e){return(0,s.jsx)(p,{...L,...e,className:(0,r.A)("alert alert--warning",e.className),children:e.children})}}};var O=t(6763);function N(e){const n=i(e),t=(o=n.type,T[o]||(O.warn(`No admonition component found for admonition type "${o}". Using Info as fallback.`),T.info));var o;return(0,s.jsx)(t,{...n})}},7878:(e,n,t)=>{t.r(n),t.d(n,{CH:()=>h,assets:()=>a,chCodeConfig:()=>x,contentTitle:()=>d,default:()=>u,frontMatter:()=>l,metadata:()=>c,toc:()=>p});t(6540);var o=t(4848),s=t(8453),i=t(4754),r=t(7293);const l={},d="Command Line Interface (CLI)",c={id:"administration/cli",title:"Command Line Interface (CLI)",description:"This page may contain outdated information. It will be updated as soon as possible.",source:"@site/docs/administration/cli.mdx",sourceDirName:"administration",slug:"/administration/cli",permalink:"/administration/cli",draft:!1,unlisted:!1,tags:[],version:"current",frontMatter:{},sidebar:"docs",previous:{title:"Sign Up and Sign In",permalink:"/administration/login"},next:{title:"Playground",permalink:"/administration/playground"}},a={},h={annotations:i.hk,Code:i.Cy},x={staticMediaQuery:"not screen, (max-width: 768px)",lineNumbers:!0,showCopyButton:!0,themeName:"github-dark"},p=[{value:"Overview",id:"overview",level:2},{value:"Options",id:"options",level:3},{value:"langflow api-key",id:"langflow-api-key",level:2},{value:"Options",id:"options-1",level:3},{value:"langflow copy-db",id:"langflow-copy-db",level:2},{value:"Options",id:"options-2",level:3},{value:"langflow migration",id:"langflow-migration",level:2},{value:"Options",id:"options-3",level:3},{value:"langflow run",id:"langflow-run",level:2},{value:"Options",id:"options-4",level:3},{value:"CLI environment variables",id:"cli-environment-variables",level:4},{value:"langflow superuser",id:"langflow-superuser",level:2},{value:"Options",id:"options-5",level:3}];function j(e){const n=Object.assign({h1:"h1",p:"p",ul:"ul",li:"li",a:"a",h2:"h2",table:"table",thead:"thead",tr:"tr",th:"th",tbody:"tbody",td:"td",code:"code",h3:"h3",h4:"h4"},(0,s.RP)(),e.components);return h||f("CH",!1),h.Code||f("CH.Code",!0),(0,o.jsxs)(o.Fragment,{children:[(0,o.jsx)("style",{dangerouslySetInnerHTML:{__html:'[data-ch-theme="github-dark"] {  --ch-t-colorScheme: dark;--ch-t-foreground: #c9d1d9;--ch-t-background: #0d1117;--ch-t-lighter-inlineBackground: #0d1117e6;--ch-t-editor-background: #0d1117;--ch-t-editor-foreground: #c9d1d9;--ch-t-editor-lineHighlightBackground: #6e76811a;--ch-t-editor-rangeHighlightBackground: #ffffff0b;--ch-t-editor-infoForeground: #3794FF;--ch-t-editor-selectionBackground: #264F78;--ch-t-focusBorder: #1f6feb;--ch-t-tab-activeBackground: #0d1117;--ch-t-tab-activeForeground: #c9d1d9;--ch-t-tab-inactiveBackground: #010409;--ch-t-tab-inactiveForeground: #8b949e;--ch-t-tab-border: #30363d;--ch-t-tab-activeBorder: #0d1117;--ch-t-editorGroup-border: #30363d;--ch-t-editorGroupHeader-tabsBackground: #010409;--ch-t-editorLineNumber-foreground: #6e7681;--ch-t-input-background: #0d1117;--ch-t-input-foreground: #c9d1d9;--ch-t-input-border: #30363d;--ch-t-icon-foreground: #8b949e;--ch-t-sideBar-background: #010409;--ch-t-sideBar-foreground: #c9d1d9;--ch-t-sideBar-border: #30363d;--ch-t-list-activeSelectionBackground: #6e768166;--ch-t-list-activeSelectionForeground: #c9d1d9;--ch-t-list-hoverBackground: #6e76811a;--ch-t-list-hoverForeground: #c9d1d9; }'}}),"\n","\n","\n",(0,o.jsx)(n.h1,{id:"command-line-interface-cli",children:"Command Line Interface (CLI)"}),"\n",(0,o.jsx)(r.A,{type:"warning",title:"warning",children:(0,o.jsx)(n.p,{children:"This page may contain outdated information. It will be updated as soon as possible."})}),"\n",(0,o.jsx)(n.p,{children:"Langflow's Command Line Interface (CLI) is a powerful tool that allows you to interact with the Langflow server from the command line. The CLI provides a wide range of commands to help you shape Langflow to your needs."}),"\n",(0,o.jsx)(n.p,{children:"The available commands are below. Navigate to their individual sections of this page to see the parameters."}),"\n",(0,o.jsxs)(n.ul,{children:["\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#overview",children:"langflow"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#langflow-api-key",children:"langflow api-key"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#langflow-copy-db",children:"langflow copy-db"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#langflow-migration",children:"langflow migration"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#langflow-run",children:"langflow run"})}),"\n",(0,o.jsx)(n.li,{children:(0,o.jsx)(n.a,{href:"#langflow-superuser",children:"langflow superuser"})}),"\n"]}),"\n",(0,o.jsx)(n.h2,{id:"overview",children:"Overview"}),"\n",(0,o.jsx)(n.p,{children:"Running the CLI without any arguments displays a list of available options and commands."}),"\n",(0,o.jsx)(h.Code,{codeConfig:x,northPanel:{tabs:[""],active:"",heightRatio:1},files:[{name:"",focus:"",code:{lines:[{tokens:[{content:"langflow",props:{style:{color:"#FFA657"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"langflow ",props:{style:{color:"#FFA657"}}},{content:"--help",props:{style:{color:"#79C0FF"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"python ",props:{style:{color:"#FFA657"}}},{content:"-m ",props:{style:{color:"#79C0FF"}}},{content:"langflow",props:{style:{color:"#A5D6FF"}}}]}],lang:"bash"},annotations:[]}]}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Command"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"api-key"})}),(0,o.jsx)(n.td,{children:"Creates an API key for the default superuser if AUTO_LOGIN is enabled."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"copy-db"})}),(0,o.jsxs)(n.td,{children:["Copy the database files to the current directory (",(0,o.jsx)(n.code,{children:"which langflow"}),")."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"migration"})}),(0,o.jsx)(n.td,{children:"Run or test migrations."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"run"})}),(0,o.jsx)(n.td,{children:"Run the Langflow."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"superuser"})}),(0,o.jsx)(n.td,{children:"Create a superuser."})]})]})]}),"\n",(0,o.jsx)(n.h3,{id:"options",children:"Options"}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Option"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--install-completion"})}),(0,o.jsx)(n.td,{children:"Install completion for the current shell."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--show-completion"})}),(0,o.jsx)(n.td,{children:"Show completion for the current shell, to copy it or customize the installation."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--help"})}),(0,o.jsx)(n.td,{children:"Show this message and exit."})]})]})]}),"\n",(0,o.jsx)(n.h2,{id:"langflow-api-key",children:"langflow api-key"}),"\n",(0,o.jsxs)(n.p,{children:["Run the ",(0,o.jsx)(n.code,{children:"api-key"})," command to create an API key for the default superuser if ",(0,o.jsx)(n.code,{children:"LANGFLOW_AUTO_LOGIN"})," is set to ",(0,o.jsx)(n.code,{children:"True"}),"."]}),"\n",(0,o.jsx)(h.Code,{codeConfig:x,northPanel:{tabs:[""],active:"",heightRatio:1},files:[{name:"",focus:"",code:{lines:[{tokens:[{content:"langflow ",props:{style:{color:"#FFA657"}}},{content:"api-key",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"python ",props:{style:{color:"#FFA657"}}},{content:"-m ",props:{style:{color:"#79C0FF"}}},{content:"langflow api-key",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u256d\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u256e",props:{style:{color:"#FFA657"}}}]},{tokens:[{content:"\u2502 ",props:{style:{color:"#FFA657"}}},{content:"API Key Created Successfully:                                       \u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502                                                                     ",props:{style:{color:"#FFA657"}}},{content:"\u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502 ",props:{style:{color:"#FFA657"}}},{content:"sk-O0elzoWID1izAH8RUKrnnvyyMwIzHi2Wk-uXWoNJ2Ro                      \u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502                                                                     ",props:{style:{color:"#FFA657"}}},{content:"\u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502 ",props:{style:{color:"#FFA657"}}},{content:"This is the only time the API key will be displayed.                \u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502 ",props:{style:{color:"#FFA657"}}},{content:"Make sure to store it in a secure location.                         \u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502                                                                     ",props:{style:{color:"#FFA657"}}},{content:"\u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2502 ",props:{style:{color:"#FFA657"}}},{content:"The API key has been copied to your clipboard. Cmd + V to paste it. \u2502",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"\u2570\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500",props:{style:{color:"#FFA657"}}}]}],lang:"bash"},annotations:[]}]}),"\n",(0,o.jsx)(n.h3,{id:"options-1",children:"Options"}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Option"}),(0,o.jsx)(n.th,{children:"Type"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:"--log-level"}),(0,o.jsx)(n.td,{children:"TEXT"}),(0,o.jsx)(n.td,{children:"Logging level. [env var: LANGFLOW_LOG_LEVEL] [default: error]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:"--help"}),(0,o.jsx)(n.td,{}),(0,o.jsx)(n.td,{children:"Show this message and exit."})]})]})]}),"\n",(0,o.jsx)(n.h2,{id:"langflow-copy-db",children:"langflow copy-db"}),"\n",(0,o.jsxs)(n.p,{children:["Run the ",(0,o.jsx)(n.code,{children:"copy-db"})," command to copy the cached ",(0,o.jsx)(n.code,{children:"langflow.db"})," and ",(0,o.jsx)(n.code,{children:"langflow-pre.db"})," database files to the current directory."]}),"\n",(0,o.jsxs)(n.p,{children:["If the files exist in the cache directory, they will be copied to the same directory as ",(0,o.jsx)(n.code,{children:"__main__.py"}),", which can be found with ",(0,o.jsx)(n.code,{children:"which langflow"}),"."]}),"\n",(0,o.jsx)(n.h3,{id:"options-2",children:"Options"}),"\n",(0,o.jsx)(n.p,{children:"None."}),"\n",(0,o.jsx)(n.h2,{id:"langflow-migration",children:"langflow migration"}),"\n",(0,o.jsxs)(n.p,{children:["Run or test migrations with the ",(0,o.jsx)(n.a,{href:"https://pypi.org/project/alembic/",children:"Alembic"})," database tool."]}),"\n",(0,o.jsx)(h.Code,{codeConfig:x,northPanel:{tabs:[""],active:"",heightRatio:1},files:[{name:"",focus:"",code:{lines:[{tokens:[{content:"langflow ",props:{style:{color:"#FFA657"}}},{content:"migration",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"python ",props:{style:{color:"#FFA657"}}},{content:"-m ",props:{style:{color:"#79C0FF"}}},{content:"langflow migration",props:{style:{color:"#A5D6FF"}}}]}],lang:"bash"},annotations:[]}]}),"\n",(0,o.jsx)(n.h3,{id:"options-3",children:"Options"}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Option"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--test, --no-test"})}),(0,o.jsx)(n.td,{children:"Run migrations in test mode. [default: test]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--fix, --no-fix"})}),(0,o.jsx)(n.td,{children:"Fix migrations. This is a destructive operation, and should only be used if you know what you are doing. [default: no-fix]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--help"})}),(0,o.jsx)(n.td,{children:"Show this message and exit."})]})]})]}),"\n",(0,o.jsx)(n.h2,{id:"langflow-run",children:"langflow run"}),"\n",(0,o.jsx)(n.p,{children:"Run Langflow."}),"\n",(0,o.jsx)(h.Code,{codeConfig:x,northPanel:{tabs:[""],active:"",heightRatio:1},files:[{name:"",focus:"",code:{lines:[{tokens:[{content:"langflow ",props:{style:{color:"#FFA657"}}},{content:"run",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"python ",props:{style:{color:"#FFA657"}}},{content:"-m ",props:{style:{color:"#79C0FF"}}},{content:"langflow run",props:{style:{color:"#A5D6FF"}}}]}],lang:"bash"},annotations:[]}]}),"\n",(0,o.jsx)(n.h3,{id:"options-4",children:"Options"}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Option"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--help"})}),(0,o.jsx)(n.td,{children:"Displays all available options."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--host"})}),(0,o.jsxs)(n.td,{children:["Defines the host to bind the server to. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_HOST"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"127.0.0.1"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--workers"})}),(0,o.jsxs)(n.td,{children:["Sets the number of worker processes. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_WORKERS"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"1"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--timeout"})}),(0,o.jsxs)(n.td,{children:["Sets the worker timeout in seconds. The default is ",(0,o.jsx)(n.code,{children:"60"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--port"})}),(0,o.jsxs)(n.td,{children:["Sets the port to listen on. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_PORT"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"7860"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--env-file"})}),(0,o.jsxs)(n.td,{children:["Specifies the path to the .env file containing environment variables. The default is ",(0,o.jsx)(n.code,{children:".env"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--log-level"})}),(0,o.jsxs)(n.td,{children:["Defines the logging level. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_LOG_LEVEL"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"critical"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--components-path"})}),(0,o.jsxs)(n.td,{children:["Specifies the path to the directory containing custom components. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_COMPONENTS_PATH"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"langflow/components"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--log-file"})}),(0,o.jsxs)(n.td,{children:["Specifies the path to the log file. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_LOG_FILE"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"logs/langflow.log"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--cache"})}),(0,o.jsxs)(n.td,{children:["Select the type of cache to use. Options are ",(0,o.jsx)(n.code,{children:"InMemoryCache"})," and ",(0,o.jsx)(n.code,{children:"SQLiteCache"}),". Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_LANGCHAIN_CACHE"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"SQLiteCache"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsxs)(n.td,{children:[(0,o.jsx)(n.code,{children:"--dev"}),"/",(0,o.jsx)(n.code,{children:"--no-dev"})]}),(0,o.jsxs)(n.td,{children:["Toggles the development mode. The default is ",(0,o.jsx)(n.code,{children:"no-dev"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--path"})}),(0,o.jsxs)(n.td,{children:["Specifies the path to the frontend directory containing build files. This option is for development purposes only. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_FRONTEND_PATH"})," environment variable."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsxs)(n.td,{children:[(0,o.jsx)(n.code,{children:"--open-browser"}),"/",(0,o.jsx)(n.code,{children:"--no-open-browser"})]}),(0,o.jsxs)(n.td,{children:["Toggles the option to open the browser after starting the server. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_OPEN_BROWSER"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"open-browser"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsxs)(n.td,{children:[(0,o.jsx)(n.code,{children:"--remove-api-keys"}),"/",(0,o.jsx)(n.code,{children:"--no-remove-api-keys"})]}),(0,o.jsxs)(n.td,{children:["Toggles the option to remove API keys from the projects saved in the database. Can be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_REMOVE_API_KEYS"})," environment variable. The default is ",(0,o.jsx)(n.code,{children:"no-remove-api-keys"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--install-completion [bash|zsh|fish|powershell|pwsh]"})}),(0,o.jsx)(n.td,{children:"Installs completion for the specified shell."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--show-completion [bash|zsh|fish|powershell|pwsh]"})}),(0,o.jsx)(n.td,{children:"Shows completion for the specified shell, allowing you to copy it or customize the installation."})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--backend-only"})}),(0,o.jsxs)(n.td,{children:["This parameter, with a default value of ",(0,o.jsx)(n.code,{children:"False"}),", allows running only the backend server without the frontend. It can also be set using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_BACKEND_ONLY"})," environment variable. For more, see ",(0,o.jsx)(n.a,{href:"../deployment/backend-only",children:"Backend-only"}),"."]})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--store"})}),(0,o.jsxs)(n.td,{children:["This parameter, with a default value of ",(0,o.jsx)(n.code,{children:"True"}),", enables the store features, use ",(0,o.jsx)(n.code,{children:"--no-store"})," to deactivate it. It can be configured using the ",(0,o.jsx)(n.code,{children:"LANGFLOW_STORE"})," environment variable."]})]})]})]}),"\n",(0,o.jsx)(n.h4,{id:"cli-environment-variables",children:"CLI environment variables"}),"\n",(0,o.jsxs)(n.p,{children:["You can configure many of the CLI options using environment variables. These can be exported in your operating system or added to a ",(0,o.jsx)(n.code,{children:".env"})," file and loaded using the ",(0,o.jsx)(n.code,{children:"--env-file"})," option."]}),"\n",(0,o.jsxs)(n.p,{children:["A sample ",(0,o.jsx)(n.code,{children:".env"})," file named ",(0,o.jsx)(n.code,{children:".env.example"})," is included with the project. Copy this file to a new file named ",(0,o.jsx)(n.code,{children:".env"})," and replace the example values with your actual settings. If you're setting values in both your OS and the ",(0,o.jsx)(n.code,{children:".env"})," file, the ",(0,o.jsx)(n.code,{children:".env"})," settings will take precedence."]}),"\n",(0,o.jsx)(n.h2,{id:"langflow-superuser",children:"langflow superuser"}),"\n",(0,o.jsx)(n.p,{children:"Create a superuser for Langflow."}),"\n",(0,o.jsx)(h.Code,{codeConfig:x,northPanel:{tabs:[""],active:"",heightRatio:1},files:[{name:"",focus:"",code:{lines:[{tokens:[{content:"langflow ",props:{style:{color:"#FFA657"}}},{content:"superuser",props:{style:{color:"#A5D6FF"}}}]},{tokens:[{content:"# or",props:{style:{color:"#8B949E"}}}]},{tokens:[{content:"python ",props:{style:{color:"#FFA657"}}},{content:"-m ",props:{style:{color:"#79C0FF"}}},{content:"langflow superuser",props:{style:{color:"#A5D6FF"}}}]}],lang:"bash"},annotations:[]}]}),"\n",(0,o.jsx)(n.h3,{id:"options-5",children:"Options"}),"\n",(0,o.jsxs)(n.table,{children:[(0,o.jsx)(n.thead,{children:(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.th,{children:"Option"}),(0,o.jsx)(n.th,{children:"Type"}),(0,o.jsx)(n.th,{children:"Description"})]})}),(0,o.jsxs)(n.tbody,{children:[(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--username"})}),(0,o.jsx)(n.td,{children:"TEXT"}),(0,o.jsx)(n.td,{children:"Username for the superuser. [default: None] [required]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--password"})}),(0,o.jsx)(n.td,{children:"TEXT"}),(0,o.jsx)(n.td,{children:"Password for the superuser. [default: None] [required]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--log-level"})}),(0,o.jsx)(n.td,{children:"TEXT"}),(0,o.jsx)(n.td,{children:"Logging level. [env var: LANGFLOW_LOG_LEVEL] [default: error]"})]}),(0,o.jsxs)(n.tr,{children:[(0,o.jsx)(n.td,{children:(0,o.jsx)(n.code,{children:"--help"})}),(0,o.jsx)(n.td,{}),(0,o.jsx)(n.td,{children:"Show this message and exit."})]})]})]})]})}const u=function(e={}){const{wrapper:n}=Object.assign({},(0,s.RP)(),e.components);return n?(0,o.jsx)(n,Object.assign({},e,{children:(0,o.jsx)(j,e)})):j(e)};function f(e,n){throw new Error("Expected "+(n?"component":"object")+" `"+e+"` to be defined: you likely forgot to import, pass, or provide it.")}}}]);