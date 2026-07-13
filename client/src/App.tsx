import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar.tsx';
import Home from './pages/Home.tsx';
import Lesson from './pages/Lesson.tsx';

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/day/:day" element={<Lesson />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
