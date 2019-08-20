/*
    Copy all the functions in your chrome console.
    Select the root node of the component you want to make a story of
    Call 'showcaser($0)' in the chrome console

    You'll probably need to format properly the file and bring some fixes (this script is really far from being perfect)
*/


function data(node, currentState, attrsFunctions) {
    const attrs = getAttrs(node);
    const hasAttrs = JSON.stringify(attrs) !== '{}';
    if (hasAttrs) {
        attrsFunctions.push(createAttrsFunction(node, attrs, currentState.length));
    };
    currentState.push(`
    { isParent: ` + (node.children.length > 0) + `, childrenCount: ` + node.children.length + `, tag: '` + node.tagName.toLowerCase() + `', attrs: {` + (hasAttrs ? ' ...get' + toCamelCase(node.tagName) + currentState.length + 'Attrs(),' : '') + ` classList: '` + Array(node.classList).join(' ') + `'` + (node.style.cssText === '' ? '' : ', style: { ' + node.style.cssText + ' }') + (node.textContent.trim() !== "" && node.children.length === 0 ? ", textContent: '" + node.textContent + "'" : "") + ` } }`);
    for (let i = 0; i < node.children.length; i++) {
        data(node.children[i], currentState, attrsFunctions);
    }
    return [currentState, attrsFunctions];
};

function getAttrs(node) {
    let attrs = {};
    try{
        attrs = Object.keys(customElements.get(node.tagName.toLowerCase()).prototype).reduce((state, key) => ({ ...state, [key]: node[key] }), {});
    }catch(err){}
    return attrs;
}

function createAttrsFunction(node, attrs, number) {
    return `
    function get`+ toCamelCase(node.tagName) + number + `Attrs(): Components.` + toCamelCase(node.tagName) + ` {
        return `+ attrsToString(attrs) + `;
    }
    `;
};

function toCamelCase(name) {
    return name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
};

function attrsToString(attrs) {
    let string;
    if(Array.isArray(attrs)){
        string = '[ '
        attrs.forEach((el) => {
            let value = undefined;
            switch (typeof el) {
                case 'object':
                    value = attrsToString(el);
                    break;
                case 'function':
                    value = undefined;
                    break;
                case 'string':
                    value = "'" + el + "'";
                    break;
                default:
                    value = el;
                    break;
            }
            string += value + ', ';
        });
        string += ' ]';
    }else{
        string = '{ ';
        Object.keys(attrs).forEach((key) => {
            if (key === 'items' || attrs[key] === null) {
                string += key + ': null, ';
                return;
            }
            let value = undefined;
            switch (typeof attrs[key]) {
                case 'object':
                    value = attrsToString(attrs[key]);
                    break;
                case 'function':
                    value = undefined;
                    break;
                case 'string':
                    value = "'" + attrs[key] + "'";
                    break;
                default:
                    value = attrs[key];
                    break;
            }
            string += "'" + key + "'" + ': ' + value + ', ';
        });
        string += ' }';
    }
    
    return string;
}

function writeShowcaseFile(data) {
    let file = `
    import { storiesOf } from '@storybook/html';
    import { Components } from '../../../../../../components';
    import { mobileViewports } from '../../base';
    
    storiesOf('', module)
      .add('', () => {
        const grid = document.createElement('yoo-storybook-grid');
    
        grid.heading = '';
        grid.subheading = '';
        grid.sizes = mobileViewports;
        grid.classList.add('nested-flex');
        grid.rows = [
          {
            items: [
              [${data[0]}
              ]
            ]
          }
        ];
        return grid;
      });
    `;
    for (let i = 0; i < data[1].length; i++) {
        file += data[1][i];
    }
    return file;
};

function showcaser(node) {
    const d = data(node, [], []);

    return writeShowcaseFile(d);
};
