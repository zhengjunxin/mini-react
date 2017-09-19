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
    // 文本的更新是直接更新
    receiveComponent(nextText) {
        const nextStringText = `${nextText}`

        if (nextStringText !== this._currentElement) {
            this._currentElement = nextStringText
            document.querySelector(`[data-reactid="${this._rootNodeID}"]`).innerHTML = this._currentElement
        }
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
    setState(newState) {
        this._reactInternalInstance.receiveComponent(null, newState)
    }
}

// 看看是否可以通过更新解决问题
function _shouldUpdateReactComponent(preElement, nextElement) {
    if (preElement != null && nextElement != null) {
        const preType = typeof preElement
        const nextType = typeof nextElement

        // 都是数字、字符，可以通过更新解决问题
        if (preType === 'string' || preType === 'number') {
            return nextType === 'string' || nextType === 'number'
        }
        else {
            // 是同一类 Component，可以通过更新解决问题
            return nextType === 'object' &&
                preElement.type === nextElement.type &&
                preElement.key === nextElement.key
        }
    }
    else {
        // 有一个直接没有了，这个时候不是更新能解决问题的了
        return false
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
    // mountComponent 方法*都是*负责返回 markup 的
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
    // 调用生命后期，判断是否需要更新，如果需要更新则调用对应实例的 receiveComponent 方法
    receiveComponent(nextElement, newState) {
        this._currentElement = nextElement || this._currentElement

        const inst = this._instance

        const nextState = Object.assign({}, inst.state, newState)
        const nextProps = this._currentElement.props

        inst.state = nextState

        if (inst.shouldComponentUpdate && inst.shouldComponentUpdate(nextProps, nextState) === false) {
            return
        }

        if (inst.componentWillUpdate) {
            inst.componentWillUpdate(nextProps, nextState)
        }

        var prevComponentInstance = this._renderedComponent;
        var prevRenderedElement = prevComponentInstance._currentElement;
        //重新执行render拿到对应的新element;
        var nextRenderedElement = this._instance.render();

        // 可以更新解决，则更新
        if (_shouldUpdateReactComponent(prevRenderedElement, nextRenderedElement)) {
            // 传入 nextElement 来更新
            // @todo 为什么这里的 ReactDOMConponent 的实例？
            // 因为 ReactClass 里还是用的 React.createElement
            prevComponentInstance.receiveComponent(nextRenderedElement)
            inst.componentUpdate && inst.componentUpdate()
        }
        // 不行则重新渲染
        else {
            const thisID = this._rootNodeID
            const _renderedComponent = this._renderedComponent = instaniateReactComponent(nextRenderedElement)
            const nextMarkup = _renderedComponent.mountComponent(thisID)
            
            // document.querySelector(`[data-reactid="${this._rootNodeID}"]`).innerHTML = nextMarkup
        }
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
        // 实例化对应的组件类的实例
        const instance = instaniateReactComponent(element)
        // 返回对应的 markup
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
        setTimeout(() => {
            this.setState({
                type: 'joe'
            })
        }, 100)
    },
    render() {
        return this.state.type
        return React.createElement(
            'div',
            null,
            this.state.type//, 'hello ', this.props.name
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
