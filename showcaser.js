/*
    Copy all the functions in your chrome console.
    Select the root node of the component you want to make a story of
    Call 'showcaser($0, false)' if you want the story with the 'items' fields or 'showcaser($0, true)' if you want them (could be useful for large data)

    You'll probably need to format properly the file and bring some fixes (this script is far from being perfect)
*/


function data(node, currentState, attrsFunctions, items) {
    const attrs = getAttrs(node);
    const hasAttrs = JSON.stringify(attrs) !== '{}';
    if (hasAttrs) {
        attrsFunctions.push(createAttrsFunction(node, attrs, currentState.length, items));
        console.log(attrsFunctions);
    };
    currentState.push(`  { isParent: ` + (node.children.length > 0) + `, childrenCount: ` + node.children.length + `, tag: '` + node.tagName.toLowerCase() + `', attrs: {` + (hasAttrs ? ' ...get' + toCamelCase(node.tagName) + currentState.length + 'Attrs(),' : '') + ` classList: '` + Array(node.classList).join(' ') + `'` + (node.style.cssText === '' ? '' : ', style: { ' + node.style.cssText + ' }') + ` } }
    `);
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

function createAttrsFunction(node, attrs, number, items) {
    return `
    function get`+ toCamelCase(node.tagName) + number + `Attrs(): Components.` + toCamelCase(node.tagName) + ` {
        return `+ attrsToString(attrs, items) + `;
    }
    `;
};

function toCamelCase(name) {
    return name.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
};

function attrsToString(attrs, items) {
    let string = '{ ';
    Object.keys(attrs).forEach((key) => {
        if ((!items && key === 'items') || attrs[key] === null) {
            string += key + ': null, ';
            return;
        }
        let value = undefined;
        switch (typeof attrs[key]) {
            case 'object':
                value = attrsToString(attrs[key], items);
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
    return string;
}

function writeShowcaseFile(data) {
    console.log(data[0]);
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
              [ 
                ${data[0]}
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

function showcaser(node, items) {
    const d = data(node, [], [], items);

    return writeShowcaseFile(d);
};
