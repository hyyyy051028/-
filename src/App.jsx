import React from 'react';
import Carousel from './components/Carousel';
import './App.css';

const images = [
  {
    url: 'https://picsum.photos/800/400?random=1',
    alt: '风景图片 1',
  },
  {
    url: 'https://picsum.photos/800/400?random=2',
    alt: '风景图片 2',
  },
  {
    url: 'https://picsum.photos/800/400?random=3',
    alt: '风景图片 3',
  },
];

function App() {
  return (
    <div className="app">
      <h1>轮播图演示</h1>
      <Carousel images={images} />
    </div>
  );
}

export default App;
