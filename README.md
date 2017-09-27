- Component 的 _currentElement 储存啥？
  - ReactDomTextComponent 是 `${text}`
  - ReactDOMComponent 是 *React.createElement* 返回的 ReactElement 的实例（存有 type、key、props）
  - ReactCompositeComponent 是 *React.createElement* 返回的 ReactElement 的实例


React.createClass 返回的是一个带有生命周期、render 方法的对象
React.createElement 返回的是有 type、key、props 的 ReactElement 实例