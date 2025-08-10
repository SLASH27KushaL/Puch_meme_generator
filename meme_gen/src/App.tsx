import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Hero from './Hero';
import Home from './Home';
import Selected from './components/Selected';
const App: React.FC = () => {
  return (
    <Routes>
      {/* Home route */}
      <Route path="/" element={<Hero />} />
<Route path="/Home" element={<Home/>}/>
  <Route path="/selected" element={<Selected/>} />

    </Routes>
  );
};

export default App;
