import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { SearchIcon, DeleteIcon } from "lucide-react";

const SearchInput = ({
    value,
    onChange,
    placeholder,
    debounce = 300,
    showClear = true,
}) => {
    const [internalValue, setInternalValue] = useState(value);

    // Debounce
    useEffect(() => {
        const handler = setTimeout(() => {
            onChange(internalValue);
        }, debounce);

        return () => clearTimeout(handler);
    }, [internalValue, debounce, onChange]);

    const handleClear = () => {
        setInternalValue("");
        onChange("");
    };

    return (
        <div className="relative w-full">

            <input
                type="text"
                value={internalValue}
                onChange={(e) => setInternalValue(e.target.value)}
                placeholder={placeholder}
                className="input input-sm input-bordered w-full pl-2 pr-8"
            />

            {/* Icon search */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
                <SearchIcon />
            </span>

            {/* Delete button */}
            {showClear && internalValue && (
                <button
                    onClick={handleClear}
                    className="absolute right-9 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-red-500"
                >
                    <DeleteIcon />
                </button>
            )}
        </div>
    );
};

SearchInput.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    debounce: PropTypes.number,
    showClear: PropTypes.bool,
    icon: PropTypes.node,
};

SearchInput.defaultProps = {
    placeholder: "Search...",
    debounce: 300,
    showClear: true,
    icon: <SearchIcon />,
};

export default SearchInput;
