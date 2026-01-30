import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import RegisterEmailStep from '../components/RegisterEmailStep';
import RegisterDetailsStep from '../components/RegisterDetailsStep';
import RegisterPasswordStep from '../components/RegisterPasswordStep';

export default function RegisterPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        email: '',
        companyName: '',
        taxId: '',
        firstName: '',
        lastName: '',
        phone: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async () => {
        setLoading(true);
        setError('');

        try {
            const res = await fetch('http://localhost:8080/admin/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const text = await res.text().catch(() => 'Registration failed');
                throw new Error(text || 'Registration failed');
            }

            // Success - if backend returns token, we can auto-login, otherwise sent to login
            // For now, let's navigate to login to force them to try credentials as requested by user verification flow
            // Actually user requested "intentar hacer login" failing, so if we auto-login it solves it, 
            // but to be safe and verify credentials work, we can redirect or just log them in.
            // The user said "realice el registro... y todo fue exitoso", implies they saw success.
            // Let's keep it simple: redirect to Login so they see "Success" then login. 
            // OR auto-login. The backend code I wrote returns a token. 
            // Let's use the token? No, user explicitly said "al intentar hacer login". 
            // So they want to explicitly login. I'll ignore the token for now or use it. 
            // I'll stick to navigating to login to be safe.
            alert("Registration successful! Please login.");
            navigate('/login');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getSubtitle = () => {
        switch (step) {
            case 1: return "Start your 30-day free trial";
            case 2: return "Tell us a bit about yourself";
            case 3: return "Secure your account";
            default: return "";
        }
    }

    return (
        <AuthLayout
            title={step === 1 ? "Create an account" : "Complete registration"}
            subtitle={getSubtitle()}
        >
            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                </div>
            )}

            {step === 1 && (
                <RegisterEmailStep
                    email={formData.email}
                    setEmail={(val) => setFormData(prev => ({ ...prev, email: val }))}
                    onNext={() => setStep(2)}
                />
            )}

            {step === 2 && (
                <RegisterDetailsStep
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={(e) => { e.preventDefault(); setStep(3); }}
                    onBack={() => setStep(1)}
                    loading={loading}
                />
            )}

            {step === 3 && (
                <RegisterPasswordStep
                    password={formData.password}
                    setPassword={(val) => setFormData(prev => ({ ...prev, password: val }))}
                    onSubmit={handleRegister}
                    onBack={() => setStep(2)}
                    loading={loading}
                />
            )}
        </AuthLayout>
    );
}
