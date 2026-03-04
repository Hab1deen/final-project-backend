import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export default function VerifyEmailPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await axios.post(`${API_URL}/api/email-verification/verify`, {
                    token
                });
                setStatus('success');
                setMessage(response.data.message || 'ยืนยันอีเมลสำเร็จ');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Token ไม่ถูกต้องหรือหมดอายุ');
            }
        };

        if (token) {
            verifyEmail();
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                    {status === 'verifying' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                กำลังยืนยันอีเมล...
                            </h1>
                            <p className="text-gray-600">
                                กรุณารอสักครู่
                            </p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                ยืนยันอีเมลสำเร็จ! 🎉
                            </h1>
                            <p className="text-gray-600 mb-6">
                                {message}
                            </p>
                            <p className="text-sm text-gray-500">
                                กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...
                            </p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                ยืนยันอีเมลไม่สำเร็จ
                            </h1>
                            <p className="text-red-600 mb-6">
                                {message}
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/resend-verification')}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                >
                                    ส่งอีเมลยืนยันใหม่
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    กลับไปหน้าเข้าสู่ระบบ
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
