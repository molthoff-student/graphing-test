import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GraphRenderer } from './graph_renderer';

function HomePage() {
    
    return (
        <h1>Hello world!</h1>
    );
}

createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <Routes>
            <Route path='/' element ={<HomePage />} />
            <Route path='/graphs/:graphIdentity' element = { <GraphRenderer /> } />
        </Routes>
    </BrowserRouter>,
)