import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import QueueDisplay from './components/QueueDisplay';

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <QueueDisplay />
    </div>
  )
}

export default App
