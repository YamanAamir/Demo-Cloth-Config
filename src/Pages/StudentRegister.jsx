import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Package } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { registerUser, setUserPassword } from '../api/api';

const { Title, Text } = Typography;

const StudentRegister = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [decodedData, setDecodedData] = useState(null);
    const [tokenError, setTokenError] = useState(false);
    const [useManualCode, setUseManualCode] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [fpLoading, setFpLoading] = useState(false);
    const submittingRef = useRef(false); // prevent duplicate submissions
    const [form] = Form.useForm();
    const [fpForm] = Form.useForm();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const rawQuery = location.search.replace(/^\?/, '');
        const token = queryParams.get('token') || rawQuery;

        if (!token || token.length < 5) {
            setTokenError(true); // Keep tokenError for the "invalid link" message
            setDecodedData(null);
            setUseManualCode(true);
            return;
        }

        try {
            const jsonString = atob(token);
            const data = JSON.parse(jsonString);

            if (data.school_id != null && data.class_id != null) {
                setDecodedData({ ...data, token });
                setTokenError(false);
                setUseManualCode(false);
            } else {
                setTokenError(true);
                setDecodedData(null);
                setUseManualCode(true); // If token is invalid, allow manual code
            }
        } catch (error) {
            console.error('Failed to decode token', error);
            setTokenError(true);
            setDecodedData(null);
            setUseManualCode(true);
        }
    }, [location.search]);

    const onFinish = async (values) => {
        // Prevent duplicate submissions
        if (submittingRef.current) return;
        submittingRef.current = true;

        const payload = {
            name: values.name,
            email: values.email,
            password: values.password,
            school_id: decodedData?.school_id,
            class_id: decodedData?.class_id || values.classCode,
            token: decodedData?.token || 'manual',
            consent_marketing: values.consent_marketing === true,
        };

        setLoading(true);
        try {
            await registerUser(payload);
            message.success('Registration successful! You can now log in.');
            navigate('/');
        } catch (error) {
            message.error(error.response?.data?.message || 'Registration failed');
            submittingRef.current = false; // allow retry on error
        } finally {
            setLoading(false);
        }
    };

    const onForgotPassword = async (values) => {
        setFpLoading(true);
        try {
            await setUserPassword({ email: values.fpEmail, password: values.newPassword });
            message.success('Password updated successfully! You can now log in.');
            setShowForgotPassword(false);
            fpForm.resetFields();
        } catch (error) {
            message.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setFpLoading(false);
        }
    };

    // If tokenError is true AND we are not using manual code (meaning it was a bad token link)
    // OR if there's no decodedData and we're not using manual code (meaning still processing or no token at all)
    // This block handles cases where a token was provided but was invalid, or no token was provided and we're not yet in manual code mode.
    if (tokenError && !useManualCode) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div className="fade-in" style={{ width: '100%', maxWidth: 440, padding: '0 20px' }}>
                    <Card className="glass-card" style={{ border: 'none', textAlign: 'center' }}>
                        <Title level={2} style={{ marginBottom: 8, color: '#006d75' }}>Student Registration</Title>
                        <Alert
                            type="warning"
                            showIcon
                            message={!location.search ? 'No registration token' : 'Invalid registration link'}
                            description={
                                !location.search
                                    ? 'Get a registration link from your class representative to join your class.'
                                    : 'This link is invalid or expired. Ask your class rep for a new link, or enter your class code below.'
                            }
                            style={{ marginBottom: 24, textAlign: 'left' }}
                        />
                        <Button type="primary" block onClick={() => setUseManualCode(true)}>
                            Enter Class Code Manually
                        </Button>
                        <Button type="link" block onClick={() => navigate('/')} style={{ marginTop: 8 }}>
                            Go to Login
                        </Button>
                    </Card>
                </div>
            </Layout>
        );
    }

    // Still resolving token (initial load with token) and not yet decided to use manual code
    if (location.search && decodedData === null && !tokenError && !useManualCode) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Card className="glass-card" style={{ border: 'none' }}>
                    <Text>Loading...</Text>
                </Card>
            </Layout>
        );
    }

    // Valid token or using manual code: show registration form
    return (
        <Layout style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="fade-in" style={{ width: '100%', maxWidth: 400, padding: '0 20px' }}>
                <Card className="glass-card" style={{ border: 'none', textAlign: 'center' }}>
                    <Title level={2} style={{ marginBottom: 8, color: '#006d75' }}>Join Your Class</Title>
                    <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
                        {useManualCode ? 'Enter your class code to register' : 'Register as a student for your class'}
                    </Text>

                    <Form
                        form={form}
                        name="register"
                        layout="vertical"
                        onFinish={onFinish}
                        size="large"
                    >
                        {useManualCode && (
                            <Form.Item
                                name="classCode"
                                rules={[{ required: true, message: 'Please enter your class code' }]}
                            >
                                <Input prefix={<Package className="w-4 h-4" />} placeholder="Class Code" />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="name"
                            rules={[{ required: true, message: 'Please enter your full name' }]}
                        >
                            <Input prefix={<UserOutlined />} placeholder="Full name" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Please enter a valid email' },
                            ]}
                        >
                            <Input prefix={<MailOutlined />} placeholder="Email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Please enter a password' },
                                { min: 6, message: 'Password must be at least 6 characters' },
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                        </Form.Item>

                        <Form.Item name="consent_marketing" valuePropName="checked" initialValue={false}>
                            <label className="flex items-start gap-2 cursor-pointer text-left">
                                <input type="checkbox" className="mt-0.5 accent-green-600 w-4 h-4 flex-shrink-0" />
                                <span className="text-xs text-slate-500 leading-relaxed">
                                    I agree to receive marketing emails from StudentLife (optional)
                                </span>
                            </label>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Register
                            </Button>
                        </Form.Item>
                    </Form>

                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Already have an account? <a href="/">Log in</a>
                    </Text>
                    <div style={{ marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Forgot password?{' '}
                            <a onClick={() => setShowForgotPassword(!showForgotPassword)}>
                                Reset it
                            </a>
                        </Text>
                    </div>

                    {showForgotPassword && (
                        <div style={{ marginTop: 16, textAlign: 'left', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                            <Text strong style={{ fontSize: 13 }}>Reset Password</Text>
                            <Form
                                form={fpForm}
                                layout="vertical"
                                onFinish={onForgotPassword}
                                size="middle"
                                style={{ marginTop: 12 }}
                            >
                                <Form.Item
                                    name="fpEmail"
                                    rules={[
                                        { required: true, message: 'Enter your email' },
                                        { type: 'email', message: 'Invalid email' },
                                    ]}
                                >
                                    <Input prefix={<MailOutlined />} placeholder="Your email" />
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
                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={fpLoading} block>
                                        Update Password
                                    </Button>
                                </Form.Item>
                            </Form>
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default StudentRegister;
