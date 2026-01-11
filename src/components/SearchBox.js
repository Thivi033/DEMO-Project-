// Search box component
import React, { useState } from 'react';
import './SearchBox.css';

const SearchBox = ({ onSearch }) => {
    const [value, setValue] = useState('');
    
    const handleChange = (e) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };
    
    return (
        <div className="search-box-container">
            <input 
                type="text"
                className="search-input"
                placeholder="Search the products..."
                value={value}
                onChange={handleChange}
            />
        </div>
    );
};

export default SearchBox;
