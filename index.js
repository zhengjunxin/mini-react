// component类负责具体的渲染、更新、删除逻辑
class ReactDomTextComponent {
    constructor(text) {
        this._currentElement = `${text}`
        this._rootNodeID = null
    }
    mountComponent(rootID) {
        this._rootNodeID = rootID
        return `<span data-reactid=${rootID}>${this._currentElement}</span>`
    }
}

function instaniateReactComponent(node) {
    const type = typeof node
    if (type === 'string' || type === 'number') {
        return new ReactDomTextComponent(node)
    }
}

const React = {
    nextReactRootIndex: 0,
    render(element, container) {
        const instance = instaniateReactComponent(element)
        const markup = instance.mountComponent(this.nextReactRootIndex)
        container.innerHTML = markup
    },
    createElement(tag, props, children) {
        
    },
}


const element = React.createElement('div', {
    id: 'test',
    onClick() {
        console.log('hello')
    }
}, 'click me')


window.onload = function() {
    React.render(element, document.getElementById("container"))
}