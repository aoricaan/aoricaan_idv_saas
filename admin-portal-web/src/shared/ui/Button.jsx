import React from 'react';

const Button = ({ children, variant = 'primary', type = 'button', className = '', ...props }) => {
    const baseStyles = 'w-full flex justify-center py-2 px-4 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 cursor-pointer';

    const variants = {
        primary: 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-indigo-500',
        text: 'border-transparent text-indigo-600 bg-transparent hover:bg-indigo-50 shadow-none',
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
