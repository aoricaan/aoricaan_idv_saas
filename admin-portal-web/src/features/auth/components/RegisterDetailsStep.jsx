import React, { useState } from 'react';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';

const RegisterDetailsStep = ({ formData, setFormData, onSubmit, onBack, loading }) => {
    const [type, setType] = useState('company'); // 'company' or 'personal'

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            <div className="flex justify-center mb-6">
                <div className="relative bg-gray-100 p-1 rounded-lg flex">
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${type === 'company'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                        onClick={() => setType('company')}
                    >
                        Company
                    </button>
                    <button
                        type="button"
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all cursor-pointer ${type === 'personal'
                                ? 'bg-white shadow text-gray-900'
                                : 'text-gray-500 hover:text-gray-900'
                            }`}
                        onClick={() => setType('personal')}
                    >
                        Personal
                    </button>
                </div>
            </div>

            {type === 'company' ? (
                <>
                    <Input
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName || ''}
                        onChange={handleChange}
                        required
                    />
                    <Input
                        label="Tax ID"
                        name="taxId"
                        value={formData.taxId || ''}
                        onChange={handleChange}
                        required
                    />
                </>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="First Name"
                            name="firstName"
                            value={formData.firstName || ''}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </>
            )}

            <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone || ''}
                onChange={handleChange}
                required
            />

            <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onBack} className="w-1/3">
                    Back
                </Button>
                <Button type="submit" disabled={loading} className="w-2/3">
                    {loading ? 'Registering...' : 'Register'}
                </Button>
            </div>
        </form>
    );
};

export default RegisterDetailsStep;
