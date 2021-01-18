const parser = require("@babel/parser");

const code = `import React from 'react';
import { TransUnit } from '@nx-plugins/i18n-react';
import { SimpleText } from '@plugins-examples/core';

/* eslint-disable-next-line */
export interface I18nFooterProps {}

export function I18nFooter(props: I18nFooterProps) {
  return (
    <div>
      <>
      <div>
      <TransUnit value={'paragraph|description@@@footer'} ns={'common'}>This is the footer</TransUnit>
      <SimpleText />
      </div>
    </>
    </div>
  );
}

export default I18nFooter;
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
// const deps = [];
// ast.program.body.forEach((item)=>{
//   if(item.type === "ImportDeclaration" && item.source.value.includes("@plugins-examples")){
//     deps.push({value: item.value});
//   }
// });
// console.log(deps);
console.log(JSON.stringify(ast))