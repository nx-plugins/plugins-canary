const parser = require("@babel/parser");

const code = `import { Plural, TransUnit } from '@nx-plugins/i18n-react';
import React, { useState } from 'react';
import { I18nHeader } from '@plugins-examples/i18n/header';

import './inbox.module.css';

/* eslint-disable-next-line */
export interface InboxProps {}

export function Inbox(props: InboxProps) {
  const [count, setCount] = useState(0);
  const user = 'name';
  return (
    <>
      <p> Hola </p>
      <TransUnit value={'paragraph|description@@@sebitas'}>
      We invited <strong>{user}<p>Hello, you are <span>Sebas </span> </p></strong>.
      </TransUnit>
      <br />
      {/* <button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        Increment
      </button>
      <br />
      <Plural value={'paragraph | description@@@sebas'} count={count}>
        Este es nuevo
      </Plural>
       */}
       <I18nHeader></I18nHeader>
    </>
  );
}

export default Inbox;

`;

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['typescript', 'jsx']
});

let output = [];
// ast.program.body.filter((i) => i.type === "ExportNamedDeclaration").forEach((item) => {
//     return item.declaration.body.body.forEach((bodyItem) => {
//         if (bodyItem.argument && bodyItem.argument.type === "JSXFragment") {
//             bodyItem.argument.children.forEach((itemChild) => {
//                 let openingElementName = itemChild.openingElement?.name.name;
//                 if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural')) ) {
//                     const value = itemChild.openingElement.attributes.find((attribute) => {
//                         return attribute.name.name === "value"
//                     }).value.expression.value;

//                     output.push({
//                         value,
//                         type: openingElementName
//                     });
//                 }
//             })
//         }
//     })
// })
// ast.program.body.forEach((i) => {
//   if (i.type === "ExportNamedDeclaration") {
//     i.declaration.body.body.forEach((bodyItem) => {
//       if (bodyItem.argument && bodyItem.argument.type === "JSXFragment") {
//         bodyItem.argument.children.forEach((itemChild) => {
//           let openingElementName = itemChild.openingElement?.name.name;
//           if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural'))) {
//             const value = itemChild.openingElement.attributes.find((attribute) => {
//               return attribute.name.name === "value"
//             }).value.expression.value;

//             output.push({
//               value,
//               type: openingElementName
//             });
//           }
//         })
//       }
//     })

//   }
// });

// console.log(JSON.stringify(ast));


// let output = [];
// ast.program.body.forEach((i) => {
//   if (i.type === "ExportNamedDeclaration") {
//     i.declaration.body.body.forEach((bodyItem) => {
//       if (bodyItem.argument && bodyItem.argument.type === "JSXFragment") {
//         bodyItem.argument.children.forEach((itemChild) => {
//           let openingElementName = itemChild.openingElement?.name.name;
//           if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural'))) {
//             const value = itemChild.openingElement.attributes.find((attribute) => {
//               return attribute.name.name === "value"
//             }).value.expression.value;
//             let content = extractContent(itemChild, content);            
            
//             output.push({
//               value,
//               type: openingElementName,
//               itemChild,
//               content
//             });
//           }
//         })
//       }
//     })

//   }
// });

// function extractContent(itemChild, contador = 0){
//   let content = '';
//   itemChild.children.forEach((item) => {
//     switch (item.type) {
//       case "JSXElement":
//         content += `<${contador}> ${extractContent(item, contador + 1)}</${contador}>`
//         contador += 1;
//         break;
//       case "JSXText":
//         content += item.value
//         break;
//       case "JSXExpressionContainer":
//         content +=  `{{${item.expression.name}}}`
//         break;
//     }
//   });
//   console.log(`Content: ${content}`);
//   return content;
// }
ast.program.body.forEach((item)=>{
  if(item.type === "ImportDeclaration" && item.source.value.includes("@plugins-examples")){

  }
});
console.log(JSON.stringify(ast))