const mdx = require('@mdx-js/mdx');
const parser = require('@babel/parser');

const content = `
<p class="hey"><TransUnit value={'paragraph|description@@@sebitas'}>
We invited Hello, you are <span>Sebas </span>.
</TransUnit>
</p>
`;
const transpile = async () => {
  const jsx = await mdx(content);
  return jsx;
};
transpile().then((data) => {
  const ast = parser.parse(data, {
    sourceType: 'module',
    plugins: ['typescript', 'jsx'],
  });

  console.log(JSON.stringify(data));
  console.log(JSON.stringify(ast));
});
