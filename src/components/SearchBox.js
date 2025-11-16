// Search box component
import React, { useState } from 'react';

const SearchBox = ({ onSearch }) => {
    const [value, setValue] = useState('');
    
    const handleChange = (e) => {
        setValue(e.target.value);
        onSearch(e.target.value);
    };
    
    return (
        <input 
            type="text"
            placeholder="Search..."
            value={value}
            onChange={handleChange}
        />
    );
};

export default SearchBox;
