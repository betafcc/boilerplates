import 'babel-polyfill'

import React from 'react'
import ReactDOM from 'react-dom'

import Hello from '../src/components/Hello'


const App = () => <div>
  <Hello title="Hello World" />
  It Works!
</div>


ReactDOM.render(<App />, document.getElementById('root'))


if (module.hot)
  module.hot.accept()
