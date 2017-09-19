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
            // 事件绑定在 document
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

class ReactClass {
    render() {

    }
}

class ReactCompositeComponent {
    constructor(element) {
        //存放元素element对象
        this._currentElement = element;
        //存放唯一标识
        this._rootNodeID = null;
        //存放对应的ReactClass的实例
        this._instance = null;
    }
    mountComponent(rootID) {
        this._rootNodeID = rootID

        const { props: publicProps, type: ReactClass } = this._currentElement

        // 这里似乎是 ReactClass 继承 spec 了
        const inst = this._instance = new ReactClass(publicProps)

        inst._reactInternalInstance = this

        if (inst.componentWillMount) {
            inst.componentWillMount()
        }

        // render 方法还是返回 ReactElement
        const renderedElement = inst.render()

        const renderedComponentInstanece = this._renderedComponent = instaniateReactComponent(renderedElement)

        const markup = renderedComponentInstanece.mountComponent(rootID)

        didMount.push(() => {
            inst.componentDidMount && inst.componentDidMount()
        })

        return markup
    }
}

// 处理 ReactElement 的渲染方式
function instaniateReactComponent(node) {
    const type = typeof node
    if (type === 'string' || type === 'number') {
        return new ReactDomTextComponent(node)
    }
    else if (type === 'object' && typeof node.type === 'string') {
        return new ReactDOMConponent(node)
    }
    else if (type === 'object' && typeof node.type === 'function') {
        return new ReactCompositeComponent(node)
    }
}

let didMount = []
const React = {
    nextReactRootIndex: 0,
    render(element, container) {
        const instance = instaniateReactComponent(element)
        const markup = instance.mountComponent(this.nextReactRootIndex)
        container.innerHTML = markup

        didMount.forEach(component => {
            component()
        })
    },
    // 返回一个 ReactElement 实例
    // 即一个包含 type、key、props属性的对象
    // React.render 来根据不同的 type，调用对应的 ReactDOMConponent 来渲染
    createElement(tag, config, children) {
        config = config || {}
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
    createClass(spec) {
        class ReactChild extends ReactClass {
            constructor(props) {
                super(props)
                this.props = props
                this.state = this.getInitialState ? this.getInitialState() : null
            }
        }
        Object.assign(ReactChild.prototype, spec)

        // ReactChild 和 spec 的继承关系是？
        return ReactChild
    }
}


const Hello = React.createClass({
    getInitialState() {
        return {
            type: 'say:'
        }
    },
    componentWillMount() {
        console.log('will Mount')
    },
    componentDidMount() {
        console.log('did Mount')
    },
    render() {
        return React.createElement(
            'div',
            null,
            this.state.type, 'hello ', this.props.name
        )
    }
})

const element = React.createElement(Hello, {
    name: 'joe'
})

window.onload = function () {
    React.render(element, document.getElementById("container"))
}

// 1、渲染普通文本
// React.render('hello', container)
// 调用 instaniateReactComponent，调用 ReactDomTextComponent 返回 <span>hello</span>

// 2、渲染 DOM 节点
// const element = {type: 'div', props: {id: '#test', children: ['hello world']}}
// React.render(element, container)
// 调用 instaniateReactComponent，调用 ReactDOMComponent，返回 <div {...props}>{React.createElement(children)}</div>

// 3、渲染 Component
// const element = {componentWillMount(){}, render() => ReactElement}
// 调用 instaniateReactComponent，调用 ReactCompositeComponent 返回 render 里的 ReactElement
// Component 只是多了声明周期而已

// ReactDomTextComponent、ReactDOMComponent、ReactCompositeComponent 的 mountComponenet 定义返回什么 markup
