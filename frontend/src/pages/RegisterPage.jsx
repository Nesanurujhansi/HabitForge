import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Loader2 } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsSubmitting(true);
    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.msg || 'Registration failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-10">
          <Link to="/" className="text-3xl font-bold text-primary font-heading">HabitForge</Link>
          <h2 className="text-2xl font-bold mt-4">Start Your Journey</h2>
          <p className="text-text-secondary mt-2">Create an account and forge better habits</p>
        </div>

        <div className="card p-8 bg-white shadow-xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm border border-red-100 italic">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <User size={18} />
                </span>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Alex Johnson"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="alex@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Confirm Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 "
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              Already have an account? {' '}
              <Link to="/login" className="text-primary font-bold hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
