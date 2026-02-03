// Navigation bar component
import React, { useState, useEffect } from 'react';

const Navbar = () => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        document.body.classList.toggle('dark-mode', darkMode);
    }, [darkMode]);

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    return (
        <nav className={darkMode ? 'navbar dark' : 'navbar'}>
            <div className="nav-links">
                <a href="/">Home</a>
                <a href="/company/about">About Us</a>
                <a href="/contact">Contact</a>
            </div>
            <button
                className="dark-mode-toggle"
                onClick={toggleDarkMode}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
                {darkMode ? '☀️' : '🌙'}
            </button>
        </nav>
    );
};

export default Navbar;
