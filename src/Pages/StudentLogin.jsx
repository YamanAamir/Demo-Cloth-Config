import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, forgotPassword, resetPassword } from '../api/api';

const { Title, Text } = Typography;

// views: 'login' | 'forgot' | 'reset'
const StudentLogin = () => {
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState('login');
    const [otpEmail, setOtpEmail] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const [loginForm] = Form.useForm();
    const [fpForm] = Form.useForm();
    const [resetForm] = Form.useForm();

    const onLogin = async (values) => {
        setLoading(true);
        try {
            const { data } = await loginUser({ email: values.username, password: values.password });
            if (data.token) {
                const userObj = data.data.user || { name: 'Admin', email: values.username };
                login(userObj, data.token);
                message.success('Welcome back!');
                userObj.role === 'class_representative' ? navigate('/my-class') : navigate('/');
            } else {
                message.error('Invalid credentials');
            }
        } catch (error) {
            message.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const onForgotPassword = async (values) => {
        setLoading(true);
        try {
            await forgotPassword({ email: values.email });
            message.success('OTP sent to your email — valid for 15 minutes.');
            setOtpEmail(values.email);
            setView('reset');
            fpForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Email not found');
        } finally {
            setLoading(false);
        }
    };

    const onResetPassword = async (values) => {
        setLoading(true);
        try {
            await resetPassword({ email: otpEmail, otp: values.otp, newPassword: values.newPassword });
            message.success('Password updated! Please log in.');
            setView('login');
            resetForm.resetFields();
            setOtpEmail('');
        } catch (error) {
            message.error(error.response?.data?.message || 'Invalid or expired OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
                <Card className="glass-card" style={{ border: 'none', textAlign: 'center' }}>

                    {/* ── LOGIN ── */}
                    {view === 'login' && (
                        <>
                            <Title level={2} style={{ marginBottom: 8, color: '#006d75' }}>Login</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                                Sign in to manage your dashboard
                            </Text>
                            <Form form={loginForm} name="login" layout="vertical" onFinish={onLogin} size="large">
                                <Form.Item name="username" rules={[{ required: true, message: 'Please input your email!' }]}>
                                    <Input prefix={<UserOutlined />} placeholder="Email" />
                                </Form.Item>
                                <Form.Item name="password" rules={[{ required: true, message: 'Please input your password!' }]}>
                                    <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block>
                                        Log in
                                    </Button>
                                </Form.Item>
                            </Form>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <a onClick={() => setView('forgot')}>Forgot password?</a>
                            </Text>
                        </>
                    )}

                    {/* ── FORGOT PASSWORD — enter email ── */}
                    {view === 'forgot' && (
                        <>
                            <Title level={3} style={{ marginBottom: 8, color: '#006d75' }}>Forgot Password</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                                Enter your email — a 6-digit OTP will be sent.
                            </Text>
                            <Form form={fpForm} layout="vertical" onFinish={onForgotPassword} size="large">
                                <Form.Item
                                    name="email"
                                    rules={[
                                        { required: true, message: 'Enter your email' },
                                        { type: 'email', message: 'Invalid email' },
                                    ]}
                                >
                                    <Input prefix={<MailOutlined />} placeholder="Your email" />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block>
                                        Send OTP
                                    </Button>
                                </Form.Item>
                            </Form>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <a onClick={() => setView('login')}>Back to login</a>
                            </Text>
                            <div style={{ marginTop: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Already have OTP?{' '}
                                    <a onClick={() => setView('reset')}>Enter OTP</a>
                                </Text>
                            </div>
                        </>
                    )}

                    {/* ── RESET PASSWORD — enter OTP + new password ── */}
                    {view === 'reset' && (
                        <>
                            <Title level={3} style={{ marginBottom: 8, color: '#006d75' }}>Reset Password</Title>
                            <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                                Enter the 6-digit OTP from your email and set a new password.
                            </Text>
                            <Form form={resetForm} layout="vertical" onFinish={onResetPassword} size="large">
                                <Form.Item
                                    name="otp"
                                    rules={[
                                        { required: true, message: 'Enter the OTP' },
                                        { len: 6, message: 'OTP must be 6 digits' },
                                    ]}
                                >
                                    <Input
                                        prefix={<SafetyOutlined />}
                                        placeholder="6-digit OTP"
                                        maxLength={6}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="newPassword"
                                    rules={[
                                        { required: true, message: 'Enter new password' },
                                        { min: 6, message: 'Min 6 characters' },
                                    ]}
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="New password" />
                                </Form.Item>
                                <Form.Item
                                    name="confirmPassword"
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Confirm your password' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject('Passwords do not match');
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                                </Form.Item>
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={loading} block>
                                        Reset Password
                                    </Button>
                                </Form.Item>
                            </Form>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <a onClick={() => setView('forgot')}>Resend OTP</a>
                                {' · '}
                                <a onClick={() => setView('login')}>Back to login</a>
                            </Text>
                        </>
                    )}

                </Card>
            </div>
        </Layout>
    );
};

export default StudentLogin;
