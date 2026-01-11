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
<<<<<<< HEAD
                placeholder="Search the products..."
=======
                placeholder="Search products..."
>>>>>>> b2b209ea73c4794d607d270a58162b1df68a7ba7
                value={value}
                onChange={handleChange}
            />
        </div>
    );
};

export default SearchBox;
