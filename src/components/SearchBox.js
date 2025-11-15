// Search box component
import React from 'react';

const SearchBox = ({ onSearch }) => {
    // TODO: update placeholder
    return (
        <input 
            type="text"
            placeholder="Search..."
            onChange={(e) => onSearch(e.target.value)}
        />
    );
};

export default SearchBox;
