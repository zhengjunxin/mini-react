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

class ReactElement {
    constructor(type, key, props) {
        this.type = type
        this.key = key
        this.props = props
    }
}

class ReactDOMConponent {
    constructor(element) {
        this._currentElement = element
        this._rootNodeID = null
    }
    // @tothink，我觉得用 createElement 生成 DOM 更好，但是居然用 html 的方式
    // 这里分步
    // 1、在 document 上处理事件
    // 2、添加其他属性
    // 3、实例化 children
    mountComponent(rootID) {
        this._rootNodeID = rootID

        const { type, key, props } = this._currentElement

        let tagOpen = `<${type}`
        let tagClose = `</${type}>`

        for (let propKey in props) {
            // 是事件
            if (/^on.+/.test(propKey)) {
                const eventType = propKey.replace('on', '').toLowerCase()
                document.addEventListener(eventType, props[propKey])
            }
            else if (propKey !== 'children') {
                tagOpen += ` ${propKey}=${props[propKey]}`
            }
        }

        let content = ''
        const children = props.children || []
        const childrenInstances = []
        children.forEach((child, index) => {
            // 递归是个好东西
            const childComponentInstance = instaniateReactComponent(child)
            childrenInstances._mountIndex = index

            childrenInstances.push(childComponentInstance)

            const childIndex = `${rootID}.${index}`
            const childMarkup = childComponentInstance.mountComponent(childIndex)

            content += childMarkup
        })

        this._renderedChildren = childrenInstances

        return `${tagOpen}>${content}${tagClose}`
    }
}

function instaniateReactComponent(node) {
    const type = typeof node
    if (type === 'string' || type === 'number') {
        return new ReactDomTextComponent(node)
    }
    else if (type === 'object' && typeof node.type === 'string') {
        return new ReactDOMConponent(node)
    }
}

const React = {
    nextReactRootIndex: 0,
    render(element, container) {
        const instance = instaniateReactComponent(element)
        const markup = instance.mountComponent(this.nextReactRootIndex)
        container.innerHTML = markup
    },
    // 返回一个 ReactElement 实例
    createElement(tag, config, children) {
        const key = config.key || null
        const props = {}

        Object.keys(config).forEach(key => {
            if (key !== 'key') {
                props[key] = config[key]
            }
        })

        const childrenLength = arguments.length - 2
        if (childrenLength === 1) {
            props.children = Array.isArray(children) ? children : [children]
        }
        else {
            props.children = [].slice.call(arguments, 2)
        }

        return new ReactElement(tag, key, props)
    },
}


const element = React.createElement('div', {
    id: 'test',
    onclick() {
        console.log('hello')
    }
}, 'click me')


window.onload = function() {
    React.render(element, document.getElementById("container"))
}