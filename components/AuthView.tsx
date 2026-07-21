
import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, CheckCircle, Loader2, ShieldCheck, Eye, EyeOff, AlertCircle, X, Building2, Shield, Key } from 'lucide-react';
import { User as UserType } from '../types';
import { useLanguage } from './LanguageContext';
import { STORAGE_KEYS } from '../config/config';

interface AuthViewProps {
  onLogin: (user: UserType) => void;
}

const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const { t } = useLanguage();
  const [authType, setAuthType] = useState<'company' | 'admin'>('company'); // 'company' for regular users, 'admin' for owner
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isSSO, setIsSSO] = useState(false); // Enterprise SSO Toggle
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  });




  const skipLogin = async () => {
    const token = "4|uuOMoZKEUgPSSvmL19qonvYuDEQTVDhw9JkORFkX61e1aa6e"; // your saved token
  
    const employee = {
      id: "6",
      name: "Mahmoud Abdelrahim",
      email: "mahmoudfattah@gmail.com",
      role: "admin",
      avatarUrl: "",
    };
  
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(employee));
  
    onLogin(employee); // مهم عشان UI يتحول authenticated فورًا
  };
  



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Validation
    if (!formData.email) {
        setError("Please enter your email address.");
        setIsLoading(false);
        return;
    }

    // Password validation only if NOT using SSO
    if (!isSSO && !formData.password) {
        setError("Please enter your password.");
        setIsLoading(false);
        return;
    }

    if (mode === 'register' && !isSSO) {
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            setIsLoading(false);
            return;
        }
    }

    // Simulate API call / SSO Redirect
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock Error Handling
    if (formData.email.includes('error')) {
        setError("Invalid credentials provided. Please try again.");
        setIsLoading(false);
        return;
    }

    // Mock Login Logic
    let user: UserType;
    
    // Platform Admin Login Logic
    if (authType === 'admin') {
        if (formData.email.toLowerCase() === 'owner@nexus.com') {
            user = {
                id: 'OWNER-001',
                name: 'Nexus Owner',
                email: formData.email,
                role: 'owner_admin',
                avatarUrl: '',
            };
        } else {
            setError("Access Denied. Invalid Platform Admin credentials.");
            setIsLoading(false);
            return;
        }
    } else {
        // Regular Company / Enterprise Login Logic
        if (formData.email.toLowerCase() === 'owner@nexus.com') {
             setError("Please use the Platform Admin tab for owner access.");
             setIsLoading(false);
             return;
        }

        // Infer role for testing purposes
        let role: 'admin' | 'manager' | 'employee' = 'admin';
        if (formData.email.toLowerCase().includes('manager')) role = 'manager';
        if (formData.email.toLowerCase().includes('employee')) role = 'employee';
        
        // Name inference for SSO/Login
        const inferredName = formData.name || formData.email.split('@')[0].charAt(0).toUpperCase() + formData.email.split('@')[0].slice(1);

        user = {
            id: 'USR-' + Math.floor(Math.random() * 1000),
            name: inferredName,
            email: formData.email,
            role: role, 
            avatarUrl: '',
            companyId: 'COMP-DEMO'
        };
    }

    // Save to local storage if remember me is checked
    if (formData.rememberMe) {
        localStorage.setItem('nexus_user', JSON.stringify(user));
    }

    // Success
    onLogin(user);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
      e.preventDefault();
      // Simulate reset email
      setResetSent(true);
      setTimeout(() => {
          setShowForgotPassword(false);
          setResetSent(false);
          setResetEmail('');
          alert("Password reset link sent to your email.");
      }, 2000);
  };

  const toggleMode = () => {
      setMode(mode === 'login' ? 'register' : 'login');
      setError(null);
      setFormData(prev => ({
          ...prev,
          password: '',
          confirmPassword: ''
      }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Visual */}
      <div className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center transition-colors duration-500 ${
          authType === 'admin' ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-600 to-purple-700'
      }`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        
        {/* Abstract Shapes */}
        <div className="absolute top-0 start-0 w-full h-full overflow-hidden">
            <div className="absolute -top-[20%] -start-[10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-3xl"></div>
            <div className="absolute bottom-[10%] end-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-3xl"></div>
        </div>

        <div className="relative z-10 p-12 text-white max-w-xl">
           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/20">
              {authType === 'admin' ? <Shield size={36} className="text-emerald-400" /> : <ShieldCheck size={36} className="text-white" />}
           </div>
           
           {authType === 'admin' ? (
             <>
               <h1 className="text-5xl font-bold mb-6 tracking-tight text-emerald-400">{t('auth.admin_access')}</h1>
               <p className="text-slate-300 text-xl leading-relaxed mb-10 font-light">
                 Secure access for Nexus ERP platform owners. Manage tenants, subscriptions, and global settings.
               </p>
               <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Lock size={16} className="text-emerald-400" /> {t('auth.secure_env')}
                  </h4>
                  <p className="text-sm text-slate-400">
                    This portal is restricted to authorized personnel only. All activities are logged and monitored for security purposes.
                  </p>
               </div>
             </>
           ) : (
             <>
               <h1 className="text-5xl font-bold mb-6 tracking-tight">{t('auth.hero_title')}</h1>
               <p className="text-indigo-100 text-xl leading-relaxed mb-10 font-light">
                 {t('auth.hero_subtitle')}
               </p>
               <div className="space-y-5">
                  <div className="flex items-center gap-4 group">
                     <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors"><CheckCircle size={22} /></div>
                     <span className="font-medium text-lg">{t('auth.feature_financial')}</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                     <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors"><CheckCircle size={22} /></div>
                     <span className="font-medium text-lg">{t('auth.feature_inventory')}</span>
                  </div>
                  <div className="flex items-center gap-4 group">
                     <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors"><CheckCircle size={22} /></div>
                     <span className="font-medium text-lg">{t('auth.feature_hr')}</span>
                  </div>
               </div>
               <div className="mt-10 pt-6 border-t border-white/20">
                   <p className="text-sm text-indigo-100 opacity-80">
                       <strong>Enterprise Access:</strong> Use <code className="bg-white/20 px-1 py-0.5 rounded">user@enterprise.com</code> to test Enterprise features.
                   </p>
               </div>
             </>
           )}
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">


        <button
  type="button"
  onClick={skipLogin}
  className="w-full py-3.5 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all"
>
  Skip Login (use saved token)
</button>

           
           {/* Auth Type Switcher */}
           <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                type="button"
                onClick={() => { setAuthType('company'); setError(null); setIsSSO(false); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                  authType === 'company' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                {t('auth.company_login')}
              </button>
              <button
                type="button"
                onClick={() => { setAuthType('admin'); setError(null); setMode('login'); setIsSSO(false); }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
                  authType === 'admin' 
                    ? 'bg-slate-800 text-emerald-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Shield size={16} />
                {t('auth.platform_admin')}
              </button>
           </div>

           <div className="text-center">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:hidden shadow-lg ${
                authType === 'admin' ? 'bg-slate-900 shadow-slate-300' : 'bg-indigo-600 shadow-indigo-200'
             }`}>
                <span className={`font-bold text-2xl ${authType === 'admin' ? 'text-emerald-400' : 'text-white'}`}>N</span>
             </div>
             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
               {authType === 'admin' 
                 ? t('auth.admin_access')
                 : (isSSO ? t('auth.enterprise_login') : (mode === 'login' ? t('auth.welcome_back') : t('auth.create_account')))
               }
             </h2>
             <p className="text-slate-500 mt-3 text-base">
               {authType === 'admin'
                  ? 'Please enter your super admin credentials.'
                  : (isSSO 
                      ? 'Log in with your organization\'s single sign-on.'
                      : (mode === 'login' ? 'Enter your credentials to access your dashboard.' : 'Start your 30-day free trial. No credit card required.')
                    )
               }
             </p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-5">
             {error && (
                 <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
                     <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                     <span>{error}</span>
                 </div>
             )}

             {mode === 'register' && authType === 'company' && !isSSO && (
               <div className="space-y-1.5">
                 <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.full_name')}</label>
                 <div className="relative group">
                   <User size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                   <input 
                     type="text" 
                     required
                     className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                     placeholder="John Doe"
                     value={formData.name}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
               </div>
             )}

             <div className="space-y-1.5">
                 <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.email')}</label>
                 <div className="relative group">
                   <Mail size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                   <input 
                     type="email" 
                     required
                     className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                     placeholder={isSSO ? "user@company.com" : "name@company.com"}
                     value={formData.email}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                   />
                 </div>
             </div>

             {!isSSO && (
                 <div className="space-y-1.5">
                     <div className="flex justify-between ms-1">
                       <label className="text-sm font-semibold text-slate-700">{t('auth.password')}</label>
                       {mode === 'login' && (
                         <button 
                            type="button" 
                            onClick={() => setShowForgotPassword(true)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                         >
                            {t('auth.forgot_password')}
                         </button>
                       )}
                     </div>
                     <div className="relative group">
                       <Lock size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input 
                         type={showPassword ? "text" : "password"}
                         required
                         className="w-full ps-11 pe-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                         placeholder="••••••••"
                         value={formData.password}
                         onChange={e => setFormData({...formData, password: e.target.value})}
                       />
                       <button 
                         type="button"
                         onClick={() => setShowPassword(!showPassword)}
                         className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                       >
                           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                       </button>
                     </div>
                 </div>
             )}

             {mode === 'register' && authType === 'company' && !isSSO && (
               <div className="space-y-1.5">
                 <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.confirm_password')}</label>
                 <div className="relative group">
                   <Lock size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                   <input 
                     type="password" 
                     required
                     className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                     placeholder="••••••••"
                     value={formData.confirmPassword}
                     onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                   />
                 </div>
               </div>
             )}

             {mode === 'login' && !isSSO && (
               <div className="flex items-center">
                 <input 
                   id="remember-me" 
                   type="checkbox" 
                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                   checked={formData.rememberMe}
                   onChange={e => setFormData({...formData, rememberMe: e.target.checked})}
                 />
                 <label htmlFor="remember-me" className="ms-2 block text-sm text-slate-600 cursor-pointer select-none">
                   {t('auth.remember_me')}
                 </label>
               </div>
             )}

             <button 
               type="submit" 
               disabled={isLoading}
               className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
                   authType === 'admin'
                    ? 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500 shadow-slate-300'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200 shadow-indigo-200'
               }`}
             >
               {isLoading ? (
                 <Loader2 size={22} className="animate-spin" />
               ) : (
                 <>
                   {isSSO ? t('auth.log_in_sso') : (mode === 'login' ? (authType === 'admin' ? t('auth.access_console') : t('auth.sign_in')) : t('auth.create_account'))}
                   <ArrowRight size={20} className="rtl:rotate-180" />
                 </>
               )}
             </button>
           </form>

           {authType === 'company' && (
               <>
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
                    </div>
                </div>

                {!isSSO ? (
                    <div className="space-y-3">
                        <button 
                            type="button" 
                            onClick={() => { setIsSSO(true); setMode('login'); setError(null); }}
                            className="w-full flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm"
                        >
                            <Key size={18} className="me-2 text-indigo-600" />
                            {t('auth.sso_button')}
                        </button>
                        <div className="grid grid-cols-2 gap-4">
                            <button type="button" className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm">
                                <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Google
                            </button>
                            <button type="button" className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm">
                                <svg className="w-5 h-5 me-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
                                </svg>
                                Facebook
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <button 
                            type="button" 
                            onClick={() => setIsSSO(false)}
                            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm hover:underline"
                        >
                            {t('auth.back_email')}
                        </button>
                    </div>
                )}

                {!isSSO && (
                    <div className="text-center pt-4">
                        <p className="text-slate-600 text-sm">
                            {mode === 'login' ? t('auth.dont_have_account') : t('auth.already_have_account')}{' '}
                            <button 
                            type="button"
                            onClick={toggleMode}
                            className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
                            >
                            {mode === 'login' ? t('auth.signup_now') : t('auth.login_link')}
                            </button>
                        </p>
                    </div>
                )}
               </>
           )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <button 
                    onClick={() => setShowForgotPassword(false)}
                    className="absolute top-4 end-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={24} />
                </button>
                
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
                        <Lock size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Reset Password</h3>
                    <p className="text-slate-500 mt-2 text-sm">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
                        <input 
                            type="email" 
                            required
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="name@company.com"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                        />
                    </div>
                    <button 
                        type="submit"
                        disabled={resetSent}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
                    >
                        {resetSent ? 'Reset Link Sent!' : 'Send Reset Link'}
                    </button>
                </form>
                <div className="text-center mt-4">
                    <button 
                        onClick={() => setShowForgotPassword(false)}
                        className="text-sm text-slate-500 hover:text-slate-800 font-medium"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
export default AuthView;


// export default AuthView;
// import React, { useState } from 'react';
// import {
//   Mail,
//   Lock,
//   User,
//   ArrowRight,
//   CheckCircle,
//   Loader2,
//   ShieldCheck,
//   Eye,
//   EyeOff,
//   AlertCircle,
//   X,
//   Building2,
//   Shield,
//   Key,
// } from 'lucide-react';
// import { User as UserType } from '../types';
// import { useLanguage } from './LanguageContext';
// import { STORAGE_KEYS } from '../config/config';
// import { authService } from '../api/authService';

// interface AuthViewProps {
//   onLogin: (user: UserType) => void;
// }

// const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
//   const { t } = useLanguage();
//   const [authType, setAuthType] = useState<'company' | 'admin'>('company'); // 'company' for regular users, 'admin' for owner
//   const [mode, setMode] = useState<'login' | 'register'>('login');
//   const [isSSO, setIsSSO] = useState(false); // Enterprise SSO Toggle
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [showPassword, setShowPassword] = useState(false);
//   const [showForgotPassword, setShowForgotPassword] = useState(false);
//   const [resetEmail, setResetEmail] = useState('');
//   const [resetSent, setResetSent] = useState(false);

//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     password: '',
//     confirmPassword: '',
//     rememberMe: false,
//   });

//   // ✅ UPDATED: real API login/register using authService
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setIsLoading(true);

//     // ===== same validations as before =====
//     if (!formData.email) {
//       setError('Please enter your email address.');
//       setIsLoading(false);
//       return;
//     }

//     // Password validation only if NOT using SSO
//     if (!isSSO && !formData.password) {
//       setError('Please enter your password.');
//       setIsLoading(false);
//       return;
//     }

//     if (mode === 'register' && !isSSO) {
//       if (formData.password !== formData.confirmPassword) {
//         setError('Passwords do not match.');
//         setIsLoading(false);
//         return;
//       }
//       if (formData.password.length < 6) {
//         setError('Password must be at least 6 characters long.');
//         setIsLoading(false);
//         return;
//       }
//     }

//     // ===== keep admin tab behavior as before (UI only / mock restriction) =====
//     if (authType === 'admin') {
//       setError('Access Denied. Platform Admin login is not integrated with API yet.');
//       setIsLoading(false);
//       return;
//     }

//     try {
//       // ===== API call =====
//       const res =
//         mode === 'login'
//           ? await authService.login({
//               email: formData.email,
//               password: formData.password,
//             })
//           : await authService.register({
//               name: formData.name,
//               email: formData.email,
//               password: formData.password,
//               password_confirmation: formData.confirmPassword,
//             });

//       /**
//        * authService should return:
//        * {
//        *   user: { id, name, email, ... },
//        *   token: "Bearer token",
//        *   token_type: "Bearer"
//        * }
//        */

//           const apiUser = res.employee;
//           const apiRole = res.employee.role
//           const token = res.token;


//       // Convert API user -> app UserType
//      const user = {
//       id: String(apiUser.id),
//       name: apiUser.name,
//       email: apiUser.email,
//       role: apiRole.name || 'Admin',
//       avatarUrl: '',
//       companyId: apiUser.company_id ? String(apiUser.company_id) : undefined,
//       token,
//     };
    


//       // Save token + user (respect rememberMe)
//       localStorage.setItem(STORAGE_KEYS.TOKEN, token);
//       if (formData.rememberMe || mode === 'register') {
//         localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
//       } else {
//         // keep token but not user if rememberMe not checked
//         localStorage.removeItem(STORAGE_KEYS.USER);
//       }

//       onLogin(user);
//     } catch (err: any) {
//       setError(err?.response?.data?.message || err?.message || 'Authentication failed. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleForgotPassword = (e: React.FormEvent) => {
//     e.preventDefault();
//     // Simulate reset email
//     setResetSent(true);
//     setTimeout(() => {
//       setShowForgotPassword(false);
//       setResetSent(false);
//       setResetEmail('');
//       alert('Password reset link sent to your email.');
//     }, 2000);
//   };

//   const toggleMode = () => {
//     setMode(mode === 'login' ? 'register' : 'login');
//     setError(null);
//     setFormData((prev) => ({
//       ...prev,
//       password: '',
//       confirmPassword: '',
//     }));
//   };

//   return (
//  <div className="min-h-screen bg-slate-50 flex flex-row [direction:ltr]">


//       {/* Left Side - Visual */}
//       <div
//         className={`hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center transition-colors duration-500 ${
//           authType === 'admin' ? 'bg-slate-900' : 'bg-gradient-to-br from-indigo-600 to-purple-700'
//         }`}
//       >
//         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>

//         {/* Abstract Shapes */}
//         <div className="absolute top-0 start-0 w-full h-full overflow-hidden">
//           <div className="absolute -top-[20%] -start-[10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-3xl"></div>
//           <div className="absolute bottom-[10%] end-[10%] w-[40%] h-[40%] rounded-full bg-indigo-500/20 blur-3xl"></div>
//         </div>

//         <div className="relative z-10 p-12 text-white max-w-xl">
//           <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 shadow-xl border border-white/20">
//             {authType === 'admin' ? <Shield size={36} className="text-emerald-400" /> : <ShieldCheck size={36} className="text-white" />}
//           </div>

//           {authType === 'admin' ? (
//             <>
//               <h1 className="text-5xl font-bold mb-6 tracking-tight text-emerald-400">{t('auth.admin_access')}</h1>
//               <p className="text-slate-300 text-xl leading-relaxed mb-10 font-light">
//                 Secure access for Nexus ERP platform owners. Manage tenants, subscriptions, and global settings.
//               </p>
//               <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
//                 <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
//                   <Lock size={16} className="text-emerald-400" /> {t('auth.secure_env')}
//                 </h4>
//                 <p className="text-sm text-slate-400">
//                   This portal is restricted to authorized personnel only. All activities are logged and monitored for security purposes.
//                 </p>
//               </div>
//             </>
//           ) : (
//             <>
//               <h1 className="text-5xl font-bold mb-6 tracking-tight">{t('auth.hero_title')}</h1>
//               <p className="text-indigo-100 text-xl leading-relaxed mb-10 font-light">{t('auth.hero_subtitle')}</p>
//               <div className="space-y-5">
//                 <div className="flex items-center gap-4 group">
//                   <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
//                     <CheckCircle size={22} />
//                   </div>
//                   <span className="font-medium text-lg">{t('auth.feature_financial')}</span>
//                 </div>
//                 <div className="flex items-center gap-4 group">
//                   <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
//                     <CheckCircle size={22} />
//                   </div>
//                   <span className="font-medium text-lg">{t('auth.feature_inventory')}</span>
//                 </div>
//                 <div className="flex items-center gap-4 group">
//                   <div className="p-2.5 bg-white/10 rounded-xl group-hover:bg-white/20 transition-colors">
//                     <CheckCircle size={22} />
//                   </div>
//                   <span className="font-medium text-lg">{t('auth.feature_hr')}</span>
//                 </div>
//               </div>
//               <div className="mt-10 pt-6 border-t border-white/20">
//                 <p className="text-sm text-indigo-100 opacity-80">
//                   <strong>Enterprise Access:</strong> Use <code className="bg-white/20 px-1 py-0.5 rounded">user@enterprise.com</code> to test Enterprise features.
//                 </p>
//               </div>
//             </>
//           )}
//         </div>
//       </div>

//       {/* Right Side - Form */}
//      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white [direction:rtl]">

//         <div className="w-full max-w-md space-y-8">
//           {/* Auth Type Switcher */}
//           <div className="flex p-1 [direction:ltr] bg-slate-100 rounded-xl mb-8">
//             <button
//               type="button"
//               onClick={() => {
//                 setAuthType('company');
//                 setError(null);
//                 setIsSSO(false);
//               }}
//               className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
//                 authType === 'company' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
//               }`}
//             >
//               <Building2 size={16} />
//               {t('auth.company_login')}
//             </button>
//             <button
//               type="button"
//               onClick={() => {
//                 setAuthType('admin');
//                 setError(null);
//                 setMode('login');
//                 setIsSSO(false);
//               }}
//               className={`flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${
//                 authType === 'admin' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'
//               }`}
//             >
//               <Shield size={16} />
//               {t('auth.platform_admin')}
//             </button>
//           </div>

//           <div className="text-center">
//             <div
//               className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 lg:hidden shadow-lg ${
//                 authType === 'admin' ? 'bg-slate-900 shadow-slate-300' : 'bg-indigo-600 shadow-indigo-200'
//               }`}
//             >
//               <span className={`font-bold text-2xl ${authType === 'admin' ? 'text-emerald-400' : 'text-white'}`}>N</span>
//             </div>
//             <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
//               {authType === 'admin'
//                 ? t('auth.admin_access')
//                 : isSSO
//                 ? t('auth.enterprise_login')
//                 : mode === 'login'
//                 ? t('auth.welcome_back')
//                 : t('auth.create_account')}
//             </h2>
//             <p className="text-slate-500 mt-3 text-base">
//               {authType === 'admin'
//                 ? 'Please enter your super admin credentials.'
//                 : isSSO
//                 ? "Log in with your organization's single sign-on."
//                 : mode === 'login'
//                 ? 'Enter your credentials to access your dashboard.'
//                 : 'Start your 30-day free trial. No credit card required.'}
//             </p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-5">
//             {error && (
//               <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
//                 <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
//                 <span>{error}</span>
//               </div>
//             )}

//             {mode === 'register' && authType === 'company' && !isSSO && (
//               <div className="space-y-1.5">
//                 <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.full_name')}</label>
//                 <div className="relative group">
//                   <User size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//                   <input
//                     type="text"
//                     required
//                     className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
//                     placeholder="John Doe"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   />
//                 </div>
//               </div>
//             )}

//             <div className="space-y-1.5">
//               <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.email')}</label>
//               <div className="relative group">
//                 <Mail size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//                 <input
//                   type="email"
//                   required
//                   className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
//                   placeholder={isSSO ? 'user@company.com' : 'name@company.com'}
//                   value={formData.email}
//                   onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                 />
//               </div>
//             </div>

//             {!isSSO && (
//               <div className="space-y-1.5">
//                 <div className="flex justify-between ms-1">
//                   <label className="text-sm font-semibold text-slate-700">{t('auth.password')}</label>
//                   {mode === 'login' && (
//                     <button
//                       type="button"
//                       onClick={() => setShowForgotPassword(true)}
//                       className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
//                     >
//                       {t('auth.forgot_password')}
//                     </button>
//                   )}
//                 </div>
//                 <div className="relative group">
//                   <Lock size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//                   <input
//                     type={showPassword ? 'text' : 'password'}
//                     required
//                     className="w-full ps-11 pe-11 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
//                     placeholder="••••••••"
//                     value={formData.password}
//                     onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                   />
//                   <button
//                     type="button"
//                     onClick={() => setShowPassword(!showPassword)}
//                     className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
//                   >
//                     {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//                   </button>
//                 </div>
//               </div>
//             )}

//             {mode === 'register' && authType === 'company' && !isSSO && (
//               <div className="space-y-1.5">
//                 <label className="text-sm font-semibold text-slate-700 ms-1">{t('auth.confirm_password')}</label>
//                 <div className="relative group">
//                   <Lock size={20} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
//                   <input
//                     type="password"
//                     required
//                     className="w-full ps-11 pe-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
//                     placeholder="••••••••"
//                     value={formData.confirmPassword}
//                     onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                   />
//                 </div>
//               </div>
//             )}

//             {mode === 'login' && !isSSO && (
//               <div className="flex items-center">
//                 <input
//                   id="remember-me"
//                   type="checkbox"
//                   className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
//                   checked={formData.rememberMe}
//                   onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
//                 />
//                 <label htmlFor="remember-me" className="ms-2 block text-sm text-slate-600 cursor-pointer select-none">
//                   {t('auth.remember_me')}
//                 </label>
//               </div>
//             )}

//             <button
//               type="submit"
//               disabled={isLoading}
//               className={`w-full py-3.5 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus:ring-4 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none ${
//                 authType === 'admin'
//                   ? 'bg-slate-900 hover:bg-slate-800 focus:ring-slate-500 shadow-slate-300'
//                   : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-200 shadow-indigo-200'
//               }`}
//             >
//               {isLoading ? (
//                 <Loader2 size={22} className="animate-spin" />
//               ) : (
//                 <>
//                   {isSSO
//                     ? t('auth.log_in_sso')
//                     : mode === 'login'
//                     ? authType === 'admin'
//                       ? t('auth.access_console')
//                       : t('auth.sign_in')
//                     : t('auth.create_account')}
//                   <ArrowRight size={20} className="rtl:rotate-180" />
//                 </>
//               )}
//             </button>
//           </form>

//           {authType === 'company' && (
//             <>
//               <div className="relative my-8">
//                 <div className="absolute inset-0 flex items-center">
//                   <div className="w-full border-t border-slate-200"></div>
//                 </div>
//                 <div className="relative flex justify-center text-sm">
//                   <span className="px-4 bg-white text-slate-500 font-medium">Or continue with</span>
//                 </div>
//               </div>

//               {!isSSO ? (
//                 <div className="space-y-3">
//                   <button
//                     type="button"
//                     onClick={() => {
//                       setIsSSO(true);
//                       setMode('login');
//                       setError(null);
//                     }}
//                     className="w-full flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm"
//                   >
//                     <Key size={18} className="me-2 text-indigo-600" />
//                     {t('auth.sso_button')}
//                   </button>
//                   <div className="grid grid-cols-2 gap-4">
//                     <button
//                       type="button"
//                       className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm"
//                     >
//                       <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
//                         <path
//                           d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                           fill="#4285F4"
//                         />
//                         <path
//                           d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                           fill="#34A853"
//                         />
//                         <path
//                           d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                           fill="#FBBC05"
//                         />
//                         <path
//                           d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                           fill="#EA4335"
//                         />
//                       </svg>
//                       Google
//                     </button>
//                     <button
//                       type="button"
//                       className="flex items-center justify-center py-3 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all bg-white text-slate-700 font-semibold text-sm"
//                     >
//                       <svg className="w-5 h-5 me-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
//                         <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z" />
//                       </svg>
//                       Facebook
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="text-center">
//                   <button
//                     type="button"
//                     onClick={() => setIsSSO(false)}
//                     className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm hover:underline"
//                   >
//                     {t('auth.back_email')}
//                   </button>
//                 </div>
//               )}

//               {!isSSO && (
//                 <div className="text-center pt-4">
//                   <p className="text-slate-600 text-sm">
//                     {mode === 'login' ? t('auth.dont_have_account') : t('auth.already_have_account')}{' '}
//                     <button
//                       type="button"
//                       onClick={toggleMode}
//                       className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-colors"
//                     >
//                       {mode === 'login' ? t('auth.signup_now') : t('auth.login_link')}
//                     </button>
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>

//       {/* Forgot Password Modal */}
//       {showForgotPassword && (
//         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
//           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
//             <button
//               onClick={() => setShowForgotPassword(false)}
//               className="absolute top-4 end-4 text-slate-400 hover:text-slate-600 transition-colors"
//             >
//               <X size={24} />
//             </button>

//             <div className="text-center mb-6">
//               <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600">
//                 <Lock size={24} />
//               </div>
//               <h3 className="text-2xl font-bold text-slate-900">Reset Password</h3>
//               <p className="text-slate-500 mt-2 text-sm">Enter your email address and we'll send you a link to reset your password.</p>
//             </div>

//             <form onSubmit={handleForgotPassword} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label>
//                 <input
//                   type="email"
//                   required
//                   className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
//                   placeholder="name@company.com"
//                   value={resetEmail}
//                   onChange={(e) => setResetEmail(e.target.value)}
//                 />
//               </div>
//               <button
//                 type="submit"
//                 disabled={resetSent}
//                 className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70"
//               >
//                 {resetSent ? 'Reset Link Sent!' : 'Send Reset Link'}
//               </button>
//             </form>
//             <div className="text-center mt-4">
//               <button onClick={() => setShowForgotPassword(false)} className="text-sm text-slate-500 hover:text-slate-800 font-medium">
//                 Back to Login
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AuthView;
