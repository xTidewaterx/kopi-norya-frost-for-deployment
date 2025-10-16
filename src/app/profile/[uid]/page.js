'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ChatWindow from '../../../chat/ChatWindow';

export default function ProfilePage() {
  const { uid } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedPhotos, setUploadedPhotos] = useState([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const storage = getStorage();

  // Track logged-in user
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (user) setShowLogin(false);
    });
    return () => unsub();
  }, []);

  // Fetch public profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!uid) return;
      try {
        const userRef = doc(db, 'publicUsers', uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setProfileUser(data);
          setUploadedPhotos(data.showcasePhotos || []);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err.message);
      }
    };
    fetchProfile();
  }, [uid]);

  // Upload images (for profile owner only)
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const storageRef = ref(storage, `userImages/${uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }

      const updatedPhotos = [...uploadedPhotos, ...uploadedUrls];
      setUploadedPhotos(updatedPhotos);

      const userRef = doc(db, 'publicUsers', uid);
      await updateDoc(userRef, { showcasePhotos: updatedPhotos });
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError('Upload failed. Try again.');
    } finally {
      setUploading(false);
    }
  };

  // Chat logic
  async function handleStartChat() {
    if (!currentUser || !uid) return;

    const sortedUIDs = [currentUser.uid, uid].sort();
    const chatsRef = collection(db, 'chats');
    const chatQuery = query(chatsRef, where('participants', '==', sortedUIDs));
    const snapshot = await getDocs(chatQuery);

    let chatRefId;
    if (!snapshot.empty) {
      chatRefId = snapshot.docs[0].id;
    } else {
      const newChatRef = await addDoc(chatsRef, {
        participants: sortedUIDs,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastSender: '',
      });
      chatRefId = newChatRef.id;

      await addDoc(collection(db, 'chats', chatRefId, 'messages'), {
        text: `${currentUser.uid} started the chat.`,
        sender: currentUser.uid,
        createdAt: serverTimestamp(),
      });
    }

    setChatId(chatRefId);
    setIsChatVisible(true);
  }

  // Auth
  async function handleSignIn(e) {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowLogin(false);
      setEmail('');
      setPassword('');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleGoogleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowLogin(false);
    } catch (err) {
      alert(err.message);
    }
  }

  if (!profileUser) {
    return (
      <p className="text-[#001f3f] p-12 text-center text-xl">Loading profile…</p>
    );
  }

  const displayName = profileUser.displayName || uid;
  const photoURL = profileUser.photoURL || '/images/default-avatar.png';
  const isOwnProfile = currentUser?.uid === uid;

  // Old showcase photos remain visible to everyone
  const defaultShowcasePhotos = [
    'https://firebasestorage.googleapis.com/v0/b/YOUR_APP/o/photo1.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/YOUR_APP/o/photo2.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/YOUR_APP/o/photo3.jpg?alt=media',
  ];

  const combinedPhotos =
    uploadedPhotos.length > 0 ? uploadedPhotos : defaultShowcasePhotos;

  return (
    <div className="bg-white text-[#001f3f] min-h-screen px-6 sm:px-12 py-14 font-serif">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center mb-16">
        <img
          src={photoURL}
          alt={`Portrait of ${displayName}`}
    className="w-86 h-60 sm:w-112 sm:h-68 object-cover rounded-2xl shadow-md mx-auto mb-5"

        />
        <h1 className="text-2xl sm:text-4xl font-bold leading-tight tracking-wide mb-4 uppercase">
          {displayName}
        </h1>
        <p className="text-lg max-w-xl mx-auto italic text-[#4b5060]">
          “Crafting legacy through stories and visuals.”
        </p>

        {/* Edit button (only owner) */}
        {isOwnProfile && (
          <div className="mt-6">
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="bg-[#001f3f] text-white px-5 py-2 rounded-full shadow hover:bg-[#0b2b4f] transition"
            >
              {showEditor ? 'Close Editor' : 'Edit Photos 🖋️'}
            </button>
          </div>
        )}
      </div>

      {/* Upload Editor (visible only to owner) */}
      {showEditor && isOwnProfile && (
        <div className="max-w-3xl mx-auto mb-10 bg-gray-50 border p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Add Images to Your Profile</h2>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="mb-3"
          />
          {uploading && <p className="text-blue-600">Uploading images...</p>}
          {uploadError && <p className="text-red-500">{uploadError}</p>}
        </div>
      )}

      {/* Full-width Image */}
      <div className="max-w-4xl mx-auto mb-10">
        <img
          src={combinedPhotos[0]}
          alt="Feature banner"
          className="w-full h-[400px] object-cover rounded-md shadow-md"
        />
      </div>

      {/* Editorial Text (kept visible to everyone) */}
      <div className="max-w-3xl mx-auto space-y-8 text-lg leading-relaxed text-[#2d2d2d] mb-12">
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed congue, sapien non dignissim
          egestas, sapien tortor volutpat magna, eget tincidunt purus felis in libero.
        </p>
        <p>
          Integer gravida libero nec ultricies cursus. Maecenas nec erat a eros pharetra sagittis.
          Etiam et sapien id libero dictum eleifend. Nulla facilisi. Suspendisse potenti.
        </p>
        <p>
          Vivamus a volutpat sem. Phasellus fringilla mauris at mattis lacinia. Duis id justo ut risus
          feugiat laoreet. Fusce sollicitudin justo in libero facilisis, eget laoreet purus iaculis.
        </p>
      </div>

      {/* Two Side-by-Side Images */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16">
        {combinedPhotos.slice(1, 3).map((url, idx) => (
          <div key={idx} className="rounded-lg overflow-hidden shadow-lg">
            <img src={url} alt={`Showcase ${idx + 2}`} className="w-full h-[280px] object-cover" />
          </div>
        ))}
      </div>

      {/* Chat Option (still visible for everyone except owner) */}
      {!isOwnProfile && (
        <div className="text-center mb-14">
          {currentUser ? (
            <button
              onClick={handleStartChat}
              className="bg-[#001f3f] text-white hover:bg-[#0b2b4f] px-6 py-3 text-lg font-medium rounded-full shadow-lg transition-colors"
            >
              Message Seller 💬
            </button>
          ) : (
            <button
              onClick={() => setShowLogin(true)}
              className="bg-gray-400 text-white px-6 py-3 text-lg font-medium rounded-full shadow-lg"
            >
              Sign in to Message 💬
            </button>
          )}
        </div>
      )}

      {/* Login Modal */}
      {showLogin && !currentUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl mb-4 text-center">Sign in to continue</h2>
            <form onSubmit={handleSignIn} className="mb-4">
              <input
                type="email"
                placeholder="Email"
                className="w-full mb-3 p-2 border rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full mb-3 p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="bg-[#001f3f] text-white px-4 py-2 rounded w-full"
              >
                Sign In
              </button>
            </form>
            <button
              onClick={handleGoogleSignIn}
              className="bg-red-500 text-white px-4 py-2 rounded w-full mb-2"
            >
              Sign in with Google
            </button>
            <button
              onClick={() => setShowLogin(false)}
              className="mt-2 text-gray-500 underline w-full text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isChatVisible && chatId && currentUser && (
        <div className="max-w-2xl mx-auto mt-10">
          <ChatWindow chatId={chatId} currentUserId={currentUser.uid} />
        </div>
      )}
    </div>
  );
}
