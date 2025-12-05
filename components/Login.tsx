
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { UserProfile, Address } from '../types';
import { Mail, Lock, User, AlertCircle, MapPin, ArrowLeft } from 'lucide-react';
import { MapPicker } from './MapPicker';

interface LoginProps {
  onLoginSuccess: (user?: UserProfile) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [step, setStep] = useState(1); // 1: Credentials, 2: Address (only for signup)
  
  // Step 1: Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [name, setName] = useState('');
  
  // Step 2: Address
  const [addressArea, setAddressArea] = useState('');
  const [addressHouse, setAddressHouse] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressCoords, setAddressCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocationSelect = (lat: number, lng: number, addr: { area: string, house: string, landmark: string, fullAddress: string }) => {
      setAddressCoords({ lat, lng });
      setAddressArea(addr.area);
      if(addr.house) setAddressHouse(addr.house);
      if(addr.landmark) setAddressLandmark(addr.landmark);
  };

  const handleNextStep = (e: React.FormEvent) => {
      e.preventDefault();
      if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          return;
      }
      setError('');
      setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign Up Flow
        
        // Final Validation for Address
        if (!addressHouse || !addressArea) {
             setError("Please enter complete address details.");
             setLoading(false);
             return;
        }

        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        if (user) {
            await user.updateProfile({
                displayName: name
            });

            const initialAddress: Address = {
                id: 'addr_default',
                type: 'Home',
                houseNo: addressHouse,
                area: addressArea,
                landmark: addressLandmark,
                lat: addressCoords?.lat || 28.6139, // Default to Delhi if no coords
                lng: addressCoords?.lng || 77.2090
            };

            // Create User Node in Realtime DB with Address
            await db.ref('users/' + user.uid).set({
                uid: user.uid,
                email: user.email,
                name: name || user.email?.split('@')[0],
                createdAt: Date.now(),
                addresses: [initialAddress]
            });
        }

        onLoginSuccess();
      } else {
        // Login Flow
        await auth.signInWithEmailAndPassword(email, password);
        onLoginSuccess();
      }
    } catch (err: any) {
      console.error("Authentication Error:", err);
      let msg = err.message;
      
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many failed attempts. Please try again later.';
      }
      
      setError(msg);
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <>
        {isSignUp && (
            <div className="relative group">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
                <input
                    type="text"
                    required={isSignUp}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 dark:text-white"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
        )}
        
        <div className="relative group">
            <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
            <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 dark:text-white"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>

        <div className="relative group">
            <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400 group-focus-within:text-purple-600 dark:group-focus-within:text-purple-400 transition-colors" />
            <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 dark:text-white"
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
        </div>
    </>
  );

  const renderStep2 = () => (
      <div className="space-y-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2 mb-1 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 p-2 rounded-lg border border-purple-100 dark:border-purple-900/50">
              <MapPin className="w-5 h-5" />
              <span className="text-sm font-bold">Set Delivery Location</span>
          </div>
          
          <div className="h-48 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <MapPicker 
                height="100%" 
                onLocationSelect={handleLocationSelect}
              />
          </div>

            <div className="relative">
                <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 text-sm dark:text-white"
                    placeholder="House / Flat / Block No."
                    value={addressHouse}
                    onChange={(e) => setAddressHouse(e.target.value)}
                />
            </div>
            
             <div className="relative">
                <input
                    type="text"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 text-sm dark:text-white"
                    placeholder="Area / Sector / Locality"
                    value={addressArea}
                    onChange={(e) => setAddressArea(e.target.value)}
                />
            </div>

            <div className="relative">
                <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 dark:focus:ring-purple-900/30 outline-none transition-all placeholder-gray-400 text-sm dark:text-white"
                    placeholder="Landmark (Optional)"
                    value={addressLandmark}
                    onChange={(e) => setAddressLandmark(e.target.value)}
                />
            </div>
      </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans relative transition-colors duration-300">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Food Background" 
            className="w-full h-full object-cover blur-sm scale-110 opacity-30 dark:opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40 dark:from-black/60 dark:to-purple-900/60" />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300 mx-4">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-900 p-8 pb-0 text-center relative">
            {isSignUp && step === 2 && (
                <button 
                    onClick={() => setStep(1)} 
                    className="absolute left-6 top-8 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
            )}

            <h1 className="text-4xl font-black italic tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              OrderEat
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">
                {isSignUp 
                    ? (step === 1 ? 'Create an account to start ordering' : 'Pin your delivery location') 
                    : 'Login to access your foodie universe'
                }
            </p>
            
            {/* Progress Dots for Signup */}
            {isSignUp && (
                <div className="flex justify-center gap-2 mt-4">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? 'w-8 bg-purple-600' : 'w-2 bg-purple-200 dark:bg-gray-700'}`}></div>
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? 'w-8 bg-purple-600' : 'w-2 bg-purple-200 dark:bg-gray-700'}`}></div>
                </div>
            )}
        </div>
        
        <div className="p-8 pt-6">
            <form className="space-y-4" onSubmit={isSignUp && step === 1 ? handleNextStep : handleSubmit}>
                
                {step === 1 ? renderStep1() : renderStep2()}

                {error && (
                    <div className="flex items-start gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30 animate-in slide-in-from-top-2">
                       <AlertCircle className="w-5 h-5 shrink-0" /> 
                       <span>{error}</span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/50 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            Processing...
                        </div>
                    ) : (isSignUp ? (step === 1 ? 'Next' : 'Create Account') : 'Login')}
                </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-4">
                 <div className="w-full flex items-center gap-4">
                    <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
                    <span className="text-xs text-gray-400 font-medium uppercase">or</span>
                    <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1" />
                 </div>

                 <p className="text-gray-600 dark:text-gray-400">
                    {isSignUp ? 'Already have an account?' : 'New to OrderEat?'}
                    <button 
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); setStep(1); }}
                        className="ml-2 text-purple-600 dark:text-purple-400 font-bold hover:underline"
                    >
                        {isSignUp ? 'Login here' : 'Create account'}
                    </button>
                </p>
            </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-950 p-4 text-center border-t border-gray-100 dark:border-gray-800">
             <p className="text-xs text-gray-400">
                By continuing, you agree to our Terms of Service & Privacy Policy
            </p>
        </div>
      </div>
    </div>
  );
};
