'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import BrandHeader from '@/components/BrandHeader';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Autentificare Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Verifică dacă este educatoare
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);

      if (educatoareSnap.exists()) {
        // Este educatoare → Dashboard educatoare
        console.log('✅ Login educatoare:', email);
        router.push('/dashboard-educatoare');
        return;
      }

      // Verifică dacă este părinte
      const parinteRef = doc(db, 'parinti', user.uid);
      const parinteSnap = await getDoc(parinteRef);

      if (parinteSnap.exists()) {
        // Este părinte → Dashboard părinte
        console.log('✅ Login părinte:', email);
        router.push('/dashboard-parinte');
        return;
      }

      // Altfel, este admin → Dashboard principal
      console.log('✅ Login admin:', email);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Eroare login:', err);
      setError('Email sau parolă incorectă');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <BrandHeader logoSize="full" showTitle={false} />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parolă
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-blue-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Se conectează...' : 'Conectare'}
            </button>
          </form>

          <p className="text-center text-gray-600 mt-6">
            Nu ai cont?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Înregistrează-te
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
