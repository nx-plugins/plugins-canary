const parser = require("@babel/parser");

const code = `import { Plural, TransUnit } from '@nx-plugins/i18n-react';
import React, { useState } from 'react';

export interface InboxProps {}

export function Inbox(props: InboxProps) {
  const [count, setCount] = useState(0);

  return (
    <>
    <Plural value={'paragraph | description@@@sebas'} count={count}>
        Este es nuevo
      </Plural>
      <TransUnit value={'paragraph|description@@@sebitas'}>
        hey
      </TransUnit>
      <TransUnit value={'paragraph|description@@@sebitas'}>
        hey1
      </TransUnit>
      <button
      onClick={() => {
        setCount(count + 1);
      }}
    >
      Increment
    </button>
    <TransUnit value={'paragraph|description@@@sebitas2'}>
        hey
      </TransUnit>
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
ast.program.body.forEach((i) => {
    if(i.type === "ExportNamedDeclaration"){
        i.declaration.body.body.forEach((bodyItem) => {
            if (bodyItem.argument && bodyItem.argument.type === "JSXFragment") {
                bodyItem.argument.children.forEach((itemChild) => {
                    let openingElementName = itemChild.openingElement?.name.name;
                    if (itemChild.type === "JSXElement" && (openingElementName.includes('TransUnit') || openingElementName.includes('Plural')) ) {
                        const value = itemChild.openingElement.attributes.find((attribute) => {
                            return attribute.name.name === "value"
                        }).value.expression.value;
                        
                        output.push({
                            value,
                            type: openingElementName
                        });
                    }
                })
            }
        })
    
    }
});

console.log(JSON.stringify(output));
