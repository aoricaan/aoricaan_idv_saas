import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import RegisterEmailStep from '../components/RegisterEmailStep';
import RegisterDetailsStep from '../components/RegisterDetailsStep';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        companyName: '',
        taxId: '',
        firstName: '',
        lastName: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Registering with:', formData);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Navigate to login after successful registration (or auto-login)
            navigate('/login');
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? "Create an account" : "Complete registration"}
            subtitle={step === 1 ? "Start your 30-day free trial" : "Tell us a bit about yourself"}
        >
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {step === 1 ? (
                <RegisterEmailStep
                    email={formData.email}
                    setEmail={(val) => setFormData(prev => ({ ...prev, email: val }))}
                    onNext={() => setStep(2)}
                />
            ) : (
                <RegisterDetailsStep
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleRegister}
                    onBack={() => setStep(1)}
                    loading={loading}
                />
            )}
        </AuthLayout>
    );
}
