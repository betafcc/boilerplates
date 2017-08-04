import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'

import Hello from '../src/components/Hello'
import World from '../src/components/World'

const App = () => <div>
  <Hello />
  <World />
</div>

ReactDOM.render(<App />, document.getElementById('root'))


if (module.hot)
  module.hot.accept()
