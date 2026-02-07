// Search box component
import React, { useState, useEffect, useCallback } from 'react';
import './SearchBox.css';

// Custom debounce hook
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
};

const SearchBox = ({ onSearch, debounceDelay = 300 }) => {
    const [value, setValue] = useState('');
    const debouncedValue = useDebounce(value, debounceDelay);

    useEffect(() => {
        if (onSearch) {
            onSearch(debouncedValue);
        }
    }, [debouncedValue, onSearch]);

    const handleChange = useCallback((e) => {
        setValue(e.target.value);
    }, []);

    return (
        <div className="search-box-container">
            <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={value}
                onChange={handleChange}
            />
        </div>
    );
};

export default SearchBox;
