import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to login. Please check your credentials.');
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
          <h2 className="text-2xl font-bold mt-4">Welcome Back</h2>
          <p className="text-text-secondary mt-2">Log in to track your progress</p>
        </div>

        <div className="card p-8 bg-white shadow-xl">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm flex items-start gap-2 border border-red-100">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Mail size={18} />
                </span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold">Password</label>
                <a href="#" className="text-xs text-primary font-medium hover:underline">Forgot?</a>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-text-secondary">
                  <Lock size={18} />
                </span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-sm text-text-secondary">
              Don't have an account? {' '}
              <Link to="/register" className="text-primary font-bold hover:underline">Register Now</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
