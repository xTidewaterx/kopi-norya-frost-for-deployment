'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ChatWindow from '../../../chat/ChatWindow';

export default function ProfilePage() {
  const { uid } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const [images, setImages] = useState(['', '', '']);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const storage = getStorage();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => setCurrentUser(user));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!uid) return;

      try {
        const userRef = doc(db, 'publicUsers', uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return;

        const data = snap.data();
        setProfileUser(data);

        const showcaseRef = collection(db, 'publicUsers', uid, 'showcase');
        const qShowcase = query(showcaseRef, orderBy('createdAt', 'desc'), limit(1));
        const showcaseSnap = await getDocs(qShowcase);

        if (!showcaseSnap.empty) {
          const showcase = showcaseSnap.docs[0].data();
          setText(showcase.text || '');
          setImages((showcase.images && showcase.images.length === 3) ? showcase.images : ['','','']);
        } else {
          setImages(data.showcasePhotos || ['', '', '']);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    }

    fetchProfile();
  }, [uid]);

  const isOwnProfile = currentUser?.uid === uid;

  async function handleImageReplace(index, file) {
    if (!file || !isOwnProfile) return;
    setUploading(true);
    setMessage('');

    try {
const storageRef = ref(storage, `users/${uid}/showcase/${Date.now()}_${file.name}`);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newImages = [...images];
      newImages[index] = url;
      setImages(newImages);
    } catch (err) {
      console.error('Image upload failed:', err);
      setMessage('❌ Image upload failed.');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!isOwnProfile) {
      setMessage('You do not have permission to save this profile.');
      return;
    }

    setUploading(true);

    try {
      const showcaseData = {
        text: text.trim(),
        images: images.filter(Boolean),
        createdAt: serverTimestamp(),
      };

      const userDocRef = doc(db, 'users', uid);
      const publicUserDocRef = doc(db, 'publicUsers', uid);

      const showcaseUserRef = collection(db, 'users', uid, 'showcase');
      const showcasePublicRef = collection(db, 'publicUsers', uid, 'showcase');

      await Promise.all([
        addDoc(showcaseUserRef, showcaseData),
        addDoc(showcasePublicRef, showcaseData),
        setDoc(userDocRef, { showcasePhotos: images, lastUpdated: serverTimestamp() }, { merge: true }),
        setDoc(publicUserDocRef, { showcasePhotos: images, lastUpdated: serverTimestamp() }, { merge: true }),
      ]);

      setEditing(false);
      setMessage('✅ Saved successfully!');
    } catch (err) {
      console.error('Save failed:', err);
      setMessage('❌ Failed to save showcase.');
    } finally {
      setUploading(false);
    }
  }

  if (!profileUser) {
    return <p className="text-center text-[#001f3f] p-10 text-xl">Loading profile...</p>;
  }

  const displayName = profileUser.displayName || 'No name';
  const photoURL = profileUser.photoURL || '/images/default-avatar.png';
  const subtext = profileUser.subtext || 'No description yet.';

  const combinedPhotos = images.map((img, i) => img || `/images/placeholder${i + 1}.jpg`);

  return (
    <div className="bg-white text-[#001f3f] min-h-screen px-6 sm:px-12 py-14 font-serif">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <img
          src={photoURL}
          alt={displayName}
          className="w-86 h-60 sm:w-112 sm:h-68 object-cover rounded-2xl shadow-md mx-auto mb-5"
        />
        <h1 className="text-3xl font-bold uppercase mb-3">{displayName}</h1>
        <p className="italic text-[#4b5060] mb-5">{subtext}</p>

        {isOwnProfile && (
          <button
            onClick={() => setEditing(!editing)}
            className="bg-[#001f3f] text-white px-5 py-2 rounded-full shadow hover:bg-[#0b2b4f] transition"
          >
            {editing ? 'Cancel' : 'Edit Page 🖋️'}
          </button>
        )}
      </div>

      <div className="max-w-4xl mx-auto mb-10 relative">
        <div className="relative group">
          <img
            src={combinedPhotos[0]}
            alt="Main showcase"
            className={`w-full h-[400px] object-cover rounded-lg shadow-md ${editing ? 'opacity-70' : ''}`}
          />
          {editing && (
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer rounded-lg">
              <span className="text-white text-4xl">＋</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageReplace(0, e.target.files[0])}
              />
            </label>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-lg text-[#2d2d2d] mb-12 space-y-8">
        {editing ? (
          <textarea
            className="w-full border rounded-lg p-3 h-40"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Edit your story..."
          />
        ) : (
          <p>{text || 'This creator has not added a story yet.'}</p>
        )}
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
        {combinedPhotos.slice(1, 3).map((url, idx) => (
          <div key={idx} className="relative group rounded-lg overflow-hidden shadow-lg">
            <img
              src={url}
              alt={`Showcase ${idx + 2}`}
              className={`w-full h-[280px] object-cover ${editing ? 'opacity-70' : ''}`}
            />
            {editing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer">
                <span className="text-white text-4xl">＋</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageReplace(idx + 1, e.target.files[0])}
                />
              </label>
            )}
          </div>
        ))}
      </div>

      {editing && isOwnProfile && (
        <div className="text-center mb-14">
          <button
            onClick={handleSave}
            disabled={uploading}
            className="bg-green-600 text-white px-6 py-3 rounded-full shadow hover:bg-green-700 transition"
          >
            {uploading ? 'Saving...' : 'Save Changes'}
          </button>
          {message && <p className="mt-3 text-gray-700">{message}</p>}
        </div>
      )}

      {isChatVisible && chatId && currentUser && (
        <div className="max-w-2xl mx-auto mt-10">
          <ChatWindow chatId={chatId} currentUserId={currentUser.uid} />
        </div>
      )}
    </div>
  );
}
