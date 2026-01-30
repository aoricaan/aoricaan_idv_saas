import React, { useState } from 'react';
import Input from '../../../shared/ui/Input';
import Button from '../../../shared/ui/Button';

const RegisterPasswordStep = ({ password, setPassword, onSubmit, onBack, loading }) => {
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm border border-red-200">
                    {error}
                </div>
            )}

            <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
            />

            <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
            />

            <div className="flex gap-3">
                <Button type="button" variant="secondary" onClick={onBack} className="w-1/3">
                    Back
                </Button>
                <Button type="submit" disabled={loading} className="w-2/3">
                    {loading ? 'Complete Registration' : 'Set Password'}
                </Button>
            </div>
        </form>
    );
};

export default RegisterPasswordStep;
