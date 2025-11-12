'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { 
  ArrowLeft,
  Send,
  Loader2,
  User,
  Clock,
  Baby,
  Reply
} from 'lucide-react';
import Link from 'next/link';
import BrandHeader from '@/components/BrandHeader';

interface Message {
  id: string;
  from: string;
  fromName: string;
  fromRole: 'educatoare' | 'parinte';
  to: string;
  toName: string;
  toRole: 'educatoare' | 'parinte';
  subject: string;
  body: string;
  copilCnp: string;
  copilNume: string;
  grupaId: string;
  read: boolean;
  createdAt: any;
  threadId: string;
  replyTo: string | null;
  threadCount: number;
}

export default function VizualizareMesajEducatoarePage() {
  const router = useRouter();
  const params = useParams();
  const messageId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [replyBody, setReplyBody] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [organizationId, setOrganizationId] = useState('');
  const [locationId, setLocationId] = useState('');

  useEffect(() => {
    incarcaMesaj();
  }, [messageId]);

  const incarcaMesaj = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        router.push('/login');
        return;
      }

      // Obține organizationId și locationId
      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);

      if (!educatoareSnap.exists()) {
        router.push('/login');
        return;
      }

      const educatoareData = educatoareSnap.data();
      setOrganizationId(educatoareData.organizationId);
      setLocationId(educatoareData.locationId);

      // Încarcă mesajul
      const messageRef = doc(
        db,
        'organizations',
        educatoareData.organizationId,
        'locations',
        educatoareData.locationId,
        'messages',
        messageId
      );

      const messageSnap = await getDoc(messageRef);
      
      if (!messageSnap.exists()) {
        alert('Mesajul nu există!');
        router.push('/dashboard-educatoare/mesaje');
        return;
      }

      const messageData = { id: messageSnap.id, ...messageSnap.data() } as Message;
      setMessage(messageData);

      // Marchează ca citit dacă este destinatar
      if (messageData.to === user.uid && !messageData.read) {
        await updateDoc(messageRef, { read: true });
        messageData.read = true;
      }

      // Încarcă toate mesajele din thread
      const messagesRef = collection(
        db,
        'organizations',
        educatoareData.organizationId,
        'locations',
        educatoareData.locationId,
        'messages'
      );

      const messagesSnap = await getDocs(messagesRef);
      
      const thread = messagesSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Message))
        .filter(msg => msg.threadId === messageData.threadId)
        .sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });

      setThreadMessages(thread);
    } catch (error) {
      console.error('Eroare încărcare mesaj:', error);
    } finally {
      setLoading(false);
    }
  };

  const trimiteRaspuns = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!replyBody.trim() || !message) return;

    setSending(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      const educatoareRef = doc(db, 'educatoare', user.uid);
      const educatoareSnap = await getDoc(educatoareRef);
      const educatoareData = educatoareSnap.data();

      // Creează răspunsul
      const messagesRef = collection(
        db,
        'organizations',
        organizationId,
        'locations',
        locationId,
        'messages'
      );

      const newReply = {
        from: user.uid,
        fromName: educatoareData?.nume || user.email || 'Educatoare',
        fromRole: 'educatoare',
        to: message.from,
        toName: message.fromName,
        toRole: message.fromRole,
        subject: `Re: ${message.subject}`,
        body: replyBody.trim(),
        copilCnp: message.copilCnp,
        copilNume: message.copilNume,
        grupaId: message.grupaId,
        read: false,
        createdAt: Timestamp.now(),
        threadId: message.threadId,
        replyTo: message.id,
        threadCount: threadMessages.length + 1
      };

      await addDoc(messagesRef, newReply);

      setReplyBody('');
      setShowReplyForm(false);
      await incarcaMesaj(); // Reîncarcă thread-ul
      
      alert('✅ Răspuns trimis cu succes!');
    } catch (error) {
      console.error('Eroare trimitere răspuns:', error);
      alert('❌ Eroare la trimiterea răspunsului');
    } finally {
      setSending(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString('ro-RO', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Se încarcă mesajul...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <BrandHeader logoSize="xl" showTitle={false} />
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Breadcrumb */}
          <Link
            href="/dashboard-educatoare/mesaje"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Înapoi la Mesaje
          </Link>

          {/* Thread de conversație */}
          <div className="space-y-4">
            {threadMessages.map((msg, index) => (
              <div
                key={msg.id}
                className={`bg-white rounded-xl shadow-lg p-6 ${
                  index > 0 ? 'ml-8 border-l-4 border-blue-300' : ''
                }`}
              >
                {/* Header mesaj */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{msg.fromName}</p>
                      <p className="text-sm text-gray-500">({msg.fromRole})</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDate(msg.createdAt)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Baby className="w-4 h-4" />
                      {msg.copilNume}
                    </div>
                  </div>
                </div>

                {/* Subiect (doar primul mesaj) */}
                {index === 0 && (
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    {msg.subject}
                  </h2>
                )}

                {/* Body */}
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{msg.body}</p>
                </div>

                {/* Indicator răspuns */}
                {index > 0 && (
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-500">
                    <Reply className="w-4 h-4" />
                    Răspuns la mesajul anterior
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Form răspuns */}
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            {!showReplyForm ? (
              <button
                onClick={() => setShowReplyForm(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                <Reply className="w-5 h-5" />
                Răspunde la acest mesaj
              </button>
            ) : (
              <form onSubmit={trimiteRaspuns} className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">💬 Răspunde:</h3>
                
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Scrie răspunsul tău aici..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  maxLength={2000}
                  required
                />
                <p className="text-sm text-gray-500">
                  {replyBody.length}/2000 caractere
                </p>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={sending || !replyBody.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Se trimite...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Trimite Răspuns
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowReplyForm(false);
                      setReplyBody('');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
                  >
                    Anulează
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
