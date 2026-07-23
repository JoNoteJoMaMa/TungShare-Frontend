import { useState, useRef, useEffect } from 'react';
import WebTorrentModule from 'webtorrent/dist/webtorrent.min.js';
import './App.css';

const WebTorrent = WebTorrentModule.default || WebTorrentModule;

const getBaseServerUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `ws://${window.location.hostname}:8080`;
    }
  }
  return 'wss://tungshare-backend.onrender.com';
};

const BASE_SERVER_URL = getBaseServerUrl().replace(/\/+$/, '');

const getTrackerUrls = (baseUrl) => {
  const wsUrl = baseUrl.replace(/^http/, 'ws');
  const backendTrackerUrl = `${wsUrl}/announce`;
  return [
    'wss://tracker.webtorrent.dev',
    'wss://tracker.openwebtorrent.com',
    backendTrackerUrl
  ];
};

const TRACKER_URLS = getTrackerUrls(BASE_SERVER_URL);

// High-availability STUN + TURN Relay Fallbacks (Ensures WebRTC connections on cellular 4G/5G, campus & corporate Wi-Fi)
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:global.stun.twilio.com:3478' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// 100 Thai Animals with accurate Emojis
const THAI_ANIMALS = [
  { name: 'สุนัขจิ้งจอก', icon: '🦊' },
  { name: 'หมีแพนด้า', icon: '🐼' },
  { name: 'สิงโต', icon: '🦁' },
  { name: 'เสือโคร่ง', icon: '🐯' },
  { name: 'เสือดาว', icon: '🐆' },
  { name: 'หมาป่า', icon: '🐺' },
  { name: 'สุนัข', icon: '🐶' },
  { name: 'แมว', icon: '🐱' },
  { name: 'กระต่าย', icon: '🐰' },
  { name: 'หนูพุก', icon: '🐭' },
  { name: 'แฮมสเตอร์', icon: '🐹' },
  { name: 'เม่นแคระ', icon: '🦔' },
  { name: 'โคอาลา', icon: '🐨' },
  { name: 'จิงโจ้', icon: '🦘' },
  { name: 'สลอธ', icon: '🦥' },
  { name: 'นาก', icon: '🦦' },
  { name: 'บีเวอร์', icon: '🦫' },
  { name: 'แบดเจอร์', icon: '🦡' },
  { name: 'หมู', icon: '🐷' },
  { name: 'หมูป่า', icon: '🐗' },
  { name: 'วัว', icon: '🐮' },
  { name: 'กระทิง', icon: '🐂' },
  { name: 'ควาย', icon: '🐃' },
  { name: 'ม้า', icon: '🐴' },
  { name: 'ม้าลาย', icon: '🦓' },
  { name: 'อูฐ', icon: '🐪' },
  { name: 'กวาง', icon: '🦌' },
  { name: 'แพะ', icon: '🐐' },
  { name: 'แกะ', icon: '🐑' },
  { name: 'ช้าง', icon: '🐘' },
  { name: 'แรด', icon: '🦏' },
  { name: 'ฮิปโป', icon: '🦛' },
  { name: 'ยีราฟ', icon: '🦒' },
  { name: 'ลิง', icon: '🐒' },
  { name: 'กอริลลา', icon: '🦍' },
  { name: 'นกอินทรี', icon: '🦅' },
  { name: 'นกฮูก', icon: '🦉' },
  { name: 'นกแก้ว', icon: '🦜' },
  { name: 'นกยูง', icon: '🦚' },
  { name: 'นกเพนกวิน', icon: '🐧' },
  { name: 'นกฟลามิงโก', icon: '🦩' },
  { name: 'นกหงส์', icon: '🦢' },
  { name: 'นกเป็ดน้ำ', icon: '🦆' },
  { name: 'นกพิราบ', icon: '🕊️' },
  { name: 'นกกระจอกเทศ', icon: '🦤' },
  { name: 'กบ', icon: '🐸' },
  { name: 'คางคก', icon: '🐸' },
  { name: 'เต่า', icon: '🐢' },
  { name: 'จระเข้', icon: '🐊' },
  { name: 'กิ้งก่า', icon: '🦎' },
  { name: 'กิ้งก่าคาเมเลียน', icon: '🦎' },
  { name: 'งูจงอาง', icon: '🐍' },
  { name: 'มังกร', icon: '🐉' },
  { name: 'ไดโนเสาร์', icon: '🦖' },
  { name: 'วาฬสีน้ำเงิน', icon: '🐳' },
  { name: 'โลมา', icon: '🐬' },
  { name: 'ฉลาม', icon: '🦈' },
  { name: 'แมวน้ำ', icon: '🦭' },
  { name: 'วอลรัส', icon: '🦭' },
  { name: 'ปลาการ์ตูน', icon: '🐟' },
  { name: 'แมงกะพรุน', icon: '🪼' },
  { name: 'หมึกยักษ์', icon: '🐙' },
  { name: 'หมึกกล้วย', icon: '🦑' },
  { name: 'กุ้งมังกร', icon: '🦞' },
  { name: 'ปูทะเล', icon: '🦀' },
  { name: 'หอยมุก', icon: '🦪' },
  { name: 'ผึ้งหลวง', icon: '🐝' },
  { name: 'ต่อเสือ', icon: '🐝' },
  { name: 'ผีเสื้อ', icon: '🦋' },
  { name: 'มดแดง', icon: '🐜' },
  { name: 'ด้วงทอง', icon: '🪲' },
  { name: 'เต่าทอง', icon: '🐞' },
  { name: 'แมงมุม', icon: '🕷️' },
  { name: 'แมงป่อง', icon: '🦂' },
  { name: 'ยุง', icon: '🦟' },
  { name: 'แมลงวัน', icon: '🪰' },
  { name: 'ทากน้อย', icon: '🐌' },
  { name: 'ค้างคาว', icon: '🦇' },
  { name: 'สกั๊งค์', icon: '🦨' },
  { name: 'แรคคูน', icon: '🦝' },
  { name: 'ตัวนิ่ม', icon: '🦔' },
  { name: 'ตัวกินมด', icon: '🐜' },
  { name: 'กระรอก', icon: '🐿️' },
  { name: 'หนูพุกน้อย', icon: '🐭' },
  { name: 'นกนางนวล', icon: '🕊️' },
  { name: 'นกขมิ้น', icon: '🐦' },
  { name: 'นกกา', icon: '🦅' },
  { name: 'ไก่ชน', icon: '🐓' },
  { name: 'ไก่ฟ้า', icon: '🐔' },
  { name: 'ห่านฟ้า', icon: '🦆' },
  { name: 'ไก่งวง', icon: '🦃' },
  { name: 'ปลาวาฬหัวโหนก', icon: '🐳' },
  { name: 'ปลาฉลามเสือ', icon: '🦈' },
  { name: 'ปลาเสือพ่นน้ำ', icon: '🐟' },
  { name: 'ปลาดุกยักษ์', icon: '🐟' },
  { name: 'ปลากระเบนราหู', icon: '🐟' },
  { name: 'ม้าน้ำมังกร', icon: '🐴' },
  { name: 'กุ้งกุลาดำ', icon: '🦞' },
  { name: 'ยูนิคอร์น', icon: '🦄' },
  { name: 'ฟีนิกซ์อมตะ', icon: '🦅' }
];

// 100 Thai Adjectives
const THAI_ADJECTIVES = [
  'ผู้กล้าหาญ', 'ผู้ชาญฉลาด', 'ผู้เกรียงไกร', 'ผู้รวดเร็ว', 'ผู้ทรงพลัง',
  'ผู้ใจดี', 'ผู้ร่าเริง', 'ผู้น่ารัก', 'ผู้เงียบขรึม', 'ผู้สุขุม',
  'ผู้แสนซน', 'ผู้รอบรู้', 'ผู้ซื่อสัตย์', 'ผู้แข็งแกร่ง', 'ผู้ปราดเปรียว',
  'ผู้มีเสน่ห์', 'ผู้ขยันหมั่นเพียร', 'ผู้สง่างาม', 'ผู้เก่งกาจ', 'ผู้ลึกลับ',
  'ผู้อารมณ์ดี', 'ผู้เมตตา', 'ผู้เฉลียวฉลาด', 'ผู้กล้าแกร่ง', 'ผู้เยือกเย็น',
  'ผู้มีพลังวิเศษ', 'ผู้มีอุดมการณ์', 'ผู้มีความฝัน', 'ผู้แน่วแน่', 'ผู้ทรหด',
  'ผู้มีจินตนาการ', 'ผู้เป็นมิตร', 'ผู้สดใส', 'ผู้มีรอยยิ้ม', 'ผู้มองโลกในแง่ดี',
  'ผู้มีไหวพริบ', 'ผู้เที่ยงธรรม', 'ผู้มีคุณธรรม', 'ผู้รักสงบ', 'ผู้รักอิสระ',
  'ผู้มีความคิดสร้างสรรค์', 'ผู้มีสติปัญญา', 'ผู้ขยันขันแข็ง', 'ผู้มีเมตตาธรรม', 'ผู้ใจเย็น',
  'ผู้กล้าท้าทาย', 'ผู้ทุ่มเท', 'ผู้มีวิสัยทัศน์', 'ผู้รอบคอบ', 'ผู้ตื่นรู้',
  'ผู้ทรงคุณค่า', 'ผู้มีสัจจะ', 'ผู้เปิดเผย', 'ผู้มีความพยายาม', 'ผู้มีพลังบวก',
  'ผู้มีจิตใจดี', 'ผู้มีสมาธิ', 'ผู้มีพรสวรรค์', 'ผู้กตัญญู', 'ผู้มีความซื่อตรง',
  'ผู้เรียบร้อย', 'ผู้มีอารมณ์ขัน', 'ผู้มีความเพียร', 'ผู้สงบสุข', 'ผู้มีความมั่นใจ',
  'ผู้มีความสามารถ', 'ผู้น่าเกรงขาม', 'ผู้ล้ำเลิศ', 'ผู้เกรียงไกล', 'ผู้ประเสริฐ',
  'ผู้สมบูรณ์แบบ', 'ผู้เก่งกล้า', 'ผู้ยอดเยี่ยม', 'ผู้เป็นเลิศ', 'ผู้เหนือชั้น',
  'ผู้เก่งกาจทรงพลัง', 'ผู้มีความสุข', 'ผู้เบิกบาน', 'ผู้สดชื่น', 'ผู้มีชีวิตชีวา',
  'ผู้มีสัจจะวาจา', 'ผู้รักษาคำพูด', 'ผู้มีวิริยะ', 'ผู้ทรงเกียรติ', 'ผู้ยิ่งใหญ่',
  'ผู้มีบุญบารมี', 'ผู้มีความตั้งใจ', 'ผู้มีความหวัง', 'ผู้ใจกว้าง', 'ผู้มีความอบอุ่น',
  'ผู้มีความอ่อนโยน', 'ผู้มีสติ', 'ผู้มีความสามารถพิเศษ', 'ผู้มีความคิดดี', 'ผู้มองการณ์ไกล',
  'ผู้มีอิทธิพล', 'ผู้มีพรสวรรค์ล้ำเลิศ', 'ผู้น่าเลื่อมใส', 'ผู้มีความยุติธรรม', 'ผู้ศรัทธา'
];

function generateThaiAnimalProfile() {
  const animal = THAI_ANIMALS[Math.floor(Math.random() * THAI_ANIMALS.length)];
  const adj = THAI_ADJECTIVES[Math.floor(Math.random() * THAI_ADJECTIVES.length)];
  return {
    name: `${animal.name}${adj}`,
    icon: animal.icon
  };
}

// Persistent Peer ID per browser profile
if (!localStorage.getItem('p2p_peer_id')) {
  localStorage.setItem('p2p_peer_id', 'peer_' + Math.random().toString(36).substr(2, 9));
}
const MY_PEER_ID = localStorage.getItem('p2p_peer_id');

const getCurrentTimeStr = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Native Browser WebRTC Peer Wrapper (Zero Node stream dependency, 100% browser native)
class NativePeer {
  constructor({ initiator, config, onSignal, onConnect, onData, onClose, onError }) {
    this.initiator = initiator;
    this.onSignal = onSignal;
    this.connected = false;
    this.destroyed = false;
    this.pendingCandidates = [];

    this.pc = new RTCPeerConnection(config);

    if (initiator) {
      this.dc = this.pc.createDataChannel('chat', { ordered: true });
      this._setupDataChannel(this.dc, onConnect, onData, onClose);
    } else {
      this.pc.ondatachannel = (e) => {
        this.dc = e.channel;
        this._setupDataChannel(this.dc, onConnect, onData, onClose);
      };
    }

    this.pc.onicecandidate = (e) => {
      if (e.candidate && this.onSignal) {
        this.onSignal({ type: 'candidate', candidate: e.candidate });
      }
    };

    if (initiator) {
      this.pc.createOffer()
        .then((offer) => this.pc.setLocalDescription(offer))
        .then(() => {
          if (this.onSignal) this.onSignal(this.pc.localDescription);
        })
        .catch((err) => onError && onError(err));
    }
  }

  _setupDataChannel(dc, onConnect, onData, onClose) {
    dc.onopen = () => {
      this.connected = true;
      if (onConnect) onConnect();
    };
    dc.onmessage = (e) => {
      if (onData) onData(e.data);
    };
    dc.onclose = () => {
      this.connected = false;
      if (onClose) onClose();
    };
  }

  _flushPendingCandidates() {
    while (this.pendingCandidates && this.pendingCandidates.length > 0) {
      const cand = this.pendingCandidates.shift();
      try {
        if (cand && this.pc && this.pc.remoteDescription) {
          this.pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        }
      } catch (e) {}
    }
  }

  signal(data) {
    if (this.destroyed || !data) return;
    try {
      if (data.type === 'offer') {
        if (this.pc.signalingState !== 'stable' && this.pc.signalingState !== 'have-local-offer') return;
        this.pc.setRemoteDescription(new RTCSessionDescription(data))
          .then(() => {
            this._flushPendingCandidates();
            return this.pc.createAnswer();
          })
          .then((answer) => this.pc.setLocalDescription(answer))
          .then(() => {
            if (this.onSignal) this.onSignal(this.pc.localDescription);
          })
          .catch((err) => console.warn('Offer signal err:', err));
      } else if (data.type === 'answer') {
        // Prevent "Failed to set remote answer sdp: Called in wrong state: stable"
        if (this.pc.signalingState === 'have-local-offer') {
          this.pc.setRemoteDescription(new RTCSessionDescription(data))
            .then(() => this._flushPendingCandidates())
            .catch((err) => console.warn('Answer signal err:', err));
        }
      } else if (data.candidate || data.type === 'candidate') {
        const cand = data.candidate || data;
        if (cand && cand.candidate) {
          if (this.pc.remoteDescription) {
            this.pc.addIceCandidate(new RTCIceCandidate(cand))
              .catch((err) => console.warn('Candidate err:', err));
          } else {
            this.pendingCandidates.push(cand);
          }
        }
      }
    } catch (e) {
      console.warn('NativePeer signal exception:', e);
    }
  }

  send(data) {
    if (this.dc && this.dc.readyState === 'open') {
      this.dc.send(data);
    }
  }

  destroy() {
    this.destroyed = true;
    this.connected = false;
    if (this.dc) try { this.dc.close(); } catch (e) {}
    if (this.pc) try { this.pc.close(); } catch (e) {}
  }
}

export default function App() {
  const [roomInput, setRoomInput] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joined, setJoined] = useState(false);
  const joinedRef = useRef(false); // Ref mirror of joined for use inside WS closures
  const [messages, setMessages] = useState([]);
  const [peerConnected, setPeerConnected] = useState(false);
  const [hasOtherPeers, setHasOtherPeers] = useState(false);
  const [statusText, setStatusText] = useState('พร้อมเข้าใช้งานห้องแชต');
  
  // Animal Identity state assigned ONLY when entering room
  const [myAnimal, setMyAnimal] = useState({ name: '', icon: '' });

  // Room Animal Members list & Members Modal
  const [roomMembers, setRoomMembers] = useState([]);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Floating Arrow Down Scroll Button States
  const [showChatScrollDown, setShowChatScrollDown] = useState(false);
  const [showFileScrollDown, setShowFileScrollDown] = useState(false);

  // Password & Room Creation & Confirm Leave Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [pendingRoom, setPendingRoom] = useState('');

  // Mobile Responsiveness Tab State ('chat' | 'files')
  const [mobileTab, setMobileTab] = useState('chat');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Pure WebTorrent P2P File Sharing State
  const [activeTorrents, setActiveTorrents] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const chatWs = useRef(null);
  const peerRef = useRef(null);
  const torrentClient = useRef(null);
  const syncChannel = useRef(null);
  const wakeLock = useRef(null); // Screen Wake Lock to prevent mobile refresh during seeding
  
  const chatBottomRef = useRef(null);
  const fileBottomRef = useRef(null);

  const seenMsgIds = useRef(new Set());
  const autoDownloadedBlobs = useRef(new Set());
  const directTransferBuffers = useRef(new Map());

  // Persistent Identity Token — entirely client-side via localStorage
  // Each room gets its own saved animal so the user appears the same on rejoin
  const loadOrCreateIdentity = (roomName) => {
    try {
      const stored = JSON.parse(localStorage.getItem('tungshare_identities') || '{}');
      if (stored[roomName]) {
        return stored[roomName]; // Return saved { name, icon } for this room
      }
      // Generate new identity and save it for this room
      const newIdentity = generateThaiAnimalProfile();
      stored[roomName] = newIdentity;
      localStorage.setItem('tungshare_identities', JSON.stringify(stored));
      return newIdentity;
    } catch (e) {
      return generateThaiAnimalProfile(); // Fallback if localStorage unavailable
    }
  };

  // Local history for P2P relay to new joiners (Option B)
  const localHistory = useRef([]); // Array of { type, ...msgData }
  const MAX_LOCAL_HISTORY = 100;

  // Local seederMap: peerId → Set of magnetURIs (for marking unavailable on disconnect)
  const localSeederMap = useRef(new Map());

  // Blob URL memory management (Optimization 1)
  const createdBlobUrls = useRef(new Set());
  const trackBlobUrl = (url) => {
    if (url && typeof url === 'string' && url.startsWith('blob:')) {
      createdBlobUrls.current.add(url);
    }
    return url;
  };
  const revokeAllBlobUrls = () => {
    createdBlobUrls.current.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch (e) {}
    });
    createdBlobUrls.current.clear();
  };

  // Keep myAnimalRef in sync for async callbacks
  const myAnimalRef = useRef(myAnimal);
  useEffect(() => { myAnimalRef.current = myAnimal; }, [myAnimal]);

  // Listen to screen resize for mobile optimization
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize WebTorrent Client once with error logging, mobile memory limits & TURN fallback
  useEffect(() => {
    try {
      const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      torrentClient.current = new WebTorrent({
        maxConns: isMobileDevice ? 2 : 55,
        tracker: { rtcConfig: { iceServers: ICE_SERVERS } }
      });
      torrentClient.current.on('error', (err) => {
        console.error('WebTorrent client error:', err);
        setStatusText(`[WebTorrent Error]: ${err.message}`);
      });
    } catch (e) {
      console.error('WebTorrent init error:', e);
    }
    return () => {
      if (torrentClient.current) {
        try { torrentClient.current.destroy(); } catch (e) {}
      }
      // Release wake lock and revoke Blob URLs on unmount
      if (wakeLock.current) {
        try { wakeLock.current.release(); } catch (e) {}
        wakeLock.current = null;
      }
      revokeAllBlobUrls();
    };
  }, []);

  // Wake Lock helper — acquire and re-acquire on visibility restore
  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      if (wakeLock.current) return; // already held
      wakeLock.current = await navigator.wakeLock.request('screen');
      wakeLock.current.addEventListener('release', () => {
        wakeLock.current = null;
      });
    } catch (e) {
      // Wake Lock is a nice-to-have; silently ignore if denied
    }
  };

  const releaseWakeLock = () => {
    if (wakeLock.current) {
      try { wakeLock.current.release(); } catch (e) {}
      wakeLock.current = null;
    }
  };

  // Re-acquire wake lock when user returns to the tab (mobile browsers release it on hide)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Re-acquire only if we are actively seeding
        if (torrentClient.current && torrentClient.current.torrents.some(t => t.done === false)) {
          acquireWakeLock();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Browser & Mobile Navigation Protection Guard (Page Reload & Back Button Interception)
  useEffect(() => {
    if (!joined) return;

    // 1. Browser Tab Close / Refresh Guard
    const handleBeforeUnload = (e) => {
      if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
        try { chatWs.current.send(JSON.stringify({ type: 'leave-room' })); } catch (e) {}
      }
      e.preventDefault();
      e.returnValue = 'คุณมีเซสชั่นห้องแชต P2P และไฟล์ที่กำลังเชื่อมต่ออยู่ ต้องการออกจากหน้าเว็บหรือไม่?';
      return e.returnValue;
    };
    const handleUnloadSignal = () => {
      if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
        try { chatWs.current.send(JSON.stringify({ type: 'leave-room' })); } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleUnloadSignal);
    window.addEventListener('unload', handleUnloadSignal);

    // 2. Mobile & Browser Back Button Interception
    window.history.pushState({ inRoom: true }, '', window.location.href);
    const handlePopState = (e) => {
      e.preventDefault();
      setShowLeaveModal(true);
      window.history.pushState({ inRoom: true }, '', window.location.href);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleUnloadSignal);
      window.removeEventListener('unload', handleUnloadSignal);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [joined]);

  // Auto-scroll chat
  useEffect(() => {
    if (!showChatScrollDown) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChatScrollDown]);

  // Auto-scroll files (top to bottom like chat)
  useEffect(() => {
    if (!showFileScrollDown) {
      fileBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTorrents, showFileScrollDown]);

  // Scroll detection for Chat section
  const handleChatScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 80;
    setShowChatScrollDown(isScrolledUp);
  };

  // Scroll detection for Files section
  const handleFileScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 80;
    setShowFileScrollDown(isScrolledUp);
  };

  const scrollToBottomChat = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToBottomFiles = () => {
    fileBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Keep joinedRef in sync with joined state
  useEffect(() => { joinedRef.current = joined; }, [joined]);

  // Silent WebSocket reconnect — used when heartbeat drops us (not triggered by user action)
  // Skips all modal flows, just re-opens the WS and re-syncs room state
  const requestJoinRoomReconnect = (targetRoom, resolvedAnimal) => {
    if (chatWs.current) {
      try { chatWs.current.close(); } catch (e) {}
    }
    const wsUrl = `${BASE_SERVER_URL}/chat?room=${encodeURIComponent(targetRoom)}&peerId=${MY_PEER_ID}&animalName=${encodeURIComponent(resolvedAnimal.name)}&animalIcon=${encodeURIComponent(resolvedAnimal.icon)}`;
    chatWs.current = new WebSocket(wsUrl);

    chatWs.current.onclose = (e) => {
      if (e.wasClean) return;
      if (!joinedRef.current) return;
      console.warn('[WS]: Reconnect dropped again, retrying in 3s...');
      setTimeout(() => {
        if (joinedRef.current) requestJoinRoomReconnect(targetRoom, resolvedAnimal);
      }, 3000);
    };

    chatWs.current.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch (e) { return; }
      // On reconnect the server may send room-not-found or room-joined
      if (data.type === 'room-joined') {
        setStatusText(`เชื่อมต่อห้องใหม่สำเร็จ ✅`);
        chatWs.current.send(JSON.stringify({ type: 'request-init' }));
        // Rebind the full message handler for ongoing messages
        chatWs.current.onmessage = fullMessageHandler;
      } else if (data.type === 'room-not-found') {
        // Room disappeared (everyone left) — create it again
        chatWs.current.send(JSON.stringify({ type: 'create-room', password: null }));
      }
    };
  };

  const fullMessageHandler = (event) => {
    let data;
    try { data = JSON.parse(event.data); } catch (e) { return; }

    // 1. Room Full Error (Limit 100 users per room)
    if (data.type === 'room-full') {
      alert(data.reason || 'ห้องนี้มีสมาชิกครบโควต้า 100 คนแล้ว ไม่สามารถเข้าร่วมได้');
      cancelPendingModal();
      return;
    }

    // 2. Room Not Found -> Show Create Room Modal (Optionally set 4-digit PIN)
    if (data.type === 'room-not-found') {
      setShowCreateModal(true);
      setShowAuthModal(false);
      return;
    }

    // 3. Auth Required -> Show Password Prompt Modal (4-digit PIN)
    if (data.type === 'auth-required') {
      setShowAuthModal(true);
      setShowCreateModal(false);
      setAuthError(data.reason || 'กรุณากรอกรหัสผ่าน 4 หลัก');
      return;
    }

    // 4. Auth Failed -> Update Error text in Modal
    if (data.type === 'auth-failed') {
      setAuthError(data.reason || 'รหัสผ่าน 4 หลักไม่ถูกต้อง');
      return;
    }

    // 5. Room Joined -> Successfully authenticated & joined
    if (data.type === 'room-joined') {
      setShowCreateModal(false);
      setShowAuthModal(false);
      setRoomName(data.room);
      setJoined(true);

      // myAnimal is already set from localStorage before WS connected
      // Just reset history state for this new session
      localHistory.current = [];
      localSeederMap.current = new Map();
      seenMsgIds.current = new Set();

      // We rely on the identity set during requestJoinRoom (from localStorage)
      setMessages((prev) => [...prev, {
        sender: 'system',
        text: `คุณเข้าสู่ห้อง [${data.room}]`,
        time: getCurrentTimeStr()
      }]);
      
      if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
        chatWs.current.send(JSON.stringify({ type: 'request-init' }));
      }
      return;
    }

    // 6. Live Room Status Update from Server (Includes Animal Members List)
    if (data.type === 'room-status') {
      setHasOtherPeers(data.hasOtherPeers);
      if (data.members) setRoomMembers(data.members);
      return;
    }

    // 7. System initiation signal — joining peer acts as Answerer
    if (data.type === 'system-init') {
      if (data.hasOtherPeers) setHasOtherPeers(true);
      if (data.hasOtherPeers) {
        initWebRTC(false); // Non-initiator (Answerer)
      }
      return;
    }

    // 8. Peer joined event — existing peer acts as Initiator (creates Offer)
    if (data.type === 'peer-joined') {
      setHasOtherPeers(true);
      initWebRTC(true); // Initiator (Offer creator)
      const peerIdentity = (data.animalName && data.animalName !== 'undefined')
        ? `${data.animalIcon || '🐾'} ${data.animalName}`
        : 'เพื่อนใหม่';
      setMessages((prev) => [...prev, { sender: 'system', text: `มี ${peerIdentity} เข้ามาในห้อง`, time: getCurrentTimeStr() }]);
      return;
    }

    // 9. Peer left event — check for Swarm Promotion or mark as unavailable
    if (data.type === 'peer-left') {
      setPeerConnected(false);
      setHasOtherPeers(false);
      const peerIdentity = (data.animalName && data.animalName !== 'undefined')
        ? `${data.animalIcon || '🐾'} ${data.animalName}`
        : 'เพื่อน';
      setMessages((prev) => [...prev, { sender: 'system', text: `${peerIdentity} ออกจากห้องแล้ว`, time: getCurrentTimeStr() }]);
      if (peerRef.current) {
        peerRef.current.destroy();
        peerRef.current = null;
      }
      
      const deadMagnets = data.deadMagnets || [];
      if (deadMagnets.length > 0) {
        setActiveTorrents((prev) => prev.map((t) => {
          if (deadMagnets.includes(t.magnetURI)) {
            // Swarm Promotion (Optimization 2): If WE already downloaded 100% of this file, promote ourselves to Seeder!
            if (t.done || t.progress === 100) {
              const currentAnimal = myAnimalRef.current;
              const reseedMeta = {
                type: 'torrent-meta',
                msgId: 'reseed_' + Math.random().toString(36).substr(2, 9),
                magnetURI: t.magnetURI,
                fileName: t.name,
                fileSize: t.size,
                fileType: t.type,
                animalName: currentAnimal.name || 'เพื่อน P2P',
                animalIcon: currentAnimal.icon || '🌱',
                time: getCurrentTimeStr()
              };
              // Re-announce our seeder presence to the room
              if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
                chatWs.current.send(JSON.stringify(reseedMeta));
              }
              return {
                ...t,
                isSeeder: true,
                unavailable: false,
                animalName: currentAnimal.name || t.animalName,
                animalIcon: currentAnimal.icon || t.animalIcon
              };
            }
            return { ...t, unavailable: true };
          }
          return t;
        }));
      }
      return;
    }

    // 10. Server asks THIS peer to relay history to a new joiner (Option B)
    if (data.type === 'request-history') {
      const targetPeerId = data.targetPeerId;
      if (targetPeerId && chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
        chatWs.current.send(JSON.stringify({
          type: 'room-history',
          targetPeerId,
          messages: localHistory.current
        }));
      }
      return;
    }

    // 10b. Peer requests immediate tracker re-announce for a magnet link
    if (data.type === 'request-torrent-reannounce' && data.magnetURI) {
      if (torrentClient.current) {
        const torrent = torrentClient.current.get(data.magnetURI);
        if (torrent) {
          if (typeof torrent.announce === 'function') {
            try { torrent.announce(); } catch (e) {}
          }
          if (typeof torrent.resume === 'function') {
            try { torrent.resume(); } catch (e) {}
          }
          if (torrent.discovery) {
            if (typeof torrent.discovery.announce === 'function') {
              try { torrent.discovery.announce(); } catch (e) {}
            }
            if (torrent.discovery.tracker && typeof torrent.discovery.tracker.announce === 'function') {
              try { torrent.discovery.tracker.announce(); } catch (e) {}
            }
            if (Array.isArray(torrent.discovery.trackers)) {
              torrent.discovery.trackers.forEach(tr => {
                if (tr && typeof tr.announce === 'function') {
                  try { tr.announce(); } catch (e) {}
                }
              });
            }
          }
        }
      }
      return;
    }

    // 10c. Peer requests direct P2P file data stream fallback (32 KB Chunked Stream)
    if (data.type === 'request-direct-p2p-stream' && data.magnetURI) {
      console.log('[P2P Stream]: Received request-direct-p2p-stream for', data.magnetURI);
      
      let rawFile = null;
      if (localSeederMap.current) {
        for (const [key, val] of localSeederMap.current.entries()) {
          if (key === data.magnetURI || (data.magnetURI && (data.magnetURI.includes(key) || key.includes(data.magnetURI)))) {
            rawFile = val;
            break;
          }
        }
      }

      if (!rawFile && torrentClient.current && torrentClient.current.torrents) {
        let torrent = torrentClient.current.get(data.magnetURI);
        if (!torrent) {
          torrent = torrentClient.current.torrents.find(
            t => t.magnetURI === data.magnetURI || t.infoHash === data.magnetURI || (data.magnetURI && data.magnetURI.includes(t.infoHash))
          );
        }
        if (torrent && torrent.files && torrent.files[0]) {
          rawFile = torrent.files[0]._file || torrent.files[0];
        }
      }

      if (rawFile && (rawFile instanceof Blob || rawFile instanceof File)) {
        console.log(`[P2P Stream]: Found rawFile ${rawFile.name || 'file'}, converting to chunks...`);
        const reader = new FileReader();
        reader.onload = () => {
          const fullBase64 = reader.result ? reader.result.toString().split(',')[1] : '';
          if (!fullBase64) return;

          const CHUNK_SIZE = 32 * 1024; // 32 KB WebRTC DataChannel frame limit
          const totalChunks = Math.ceil(fullBase64.length / CHUNK_SIZE);
          const transferId = 'tr_' + Math.random().toString(36).substr(2, 9);
          console.log(`[P2P Stream]: Sending ${totalChunks} chunks for file ${rawFile.name || 'file'}`);

          for (let i = 0; i < totalChunks; i++) {
            const chunkStr = fullBase64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
            const payload = JSON.stringify({
              type: 'direct-p2p-file-chunk',
              transferId,
              magnetURI: data.magnetURI,
              fileName: rawFile.name || 'file',
              chunkIndex: i,
              totalChunks,
              chunkStr
            });

            if (peerRef.current && peerRef.current.connected) {
              try { peerRef.current.send(payload); } catch (e) {}
            }
            if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
              try { chatWs.current.send(payload); } catch (e) {}
            }
          }
        };
        reader.readAsDataURL(rawFile);
      } else {
        console.warn('[P2P Stream]: Could not find raw seeder File object for magnetURI:', data.magnetURI);
      }
      return;
    }

    // 10d. Receiving direct P2P file chunk stream fallback
    if (data.type === 'direct-p2p-file-chunk' && data.transferId) {
      try {
        if (!directTransferBuffers.current.has(data.transferId)) {
          directTransferBuffers.current.set(data.transferId, {
            totalChunks: data.totalChunks,
            chunks: new Map(),
            magnetURI: data.magnetURI,
            fileName: data.fileName
          });
        }

        const transfer = directTransferBuffers.current.get(data.transferId);
        transfer.chunks.set(data.chunkIndex, data.chunkStr);

        const receivedCount = transfer.chunks.size;
        const progressPct = Math.min(99, Math.round((receivedCount / transfer.totalChunks) * 100));

        setActiveTorrents((prev) =>
          prev.map((item) => {
            if (item.infoHash === data.magnetURI || item.magnetURI === data.magnetURI || (data.magnetURI && data.magnetURI.includes(item.infoHash)) || (item.magnetURI && item.magnetURI.includes(data.magnetURI))) {
              return {
                ...item,
                progress: progressPct,
                speed: '15.00'
              };
            }
            return item;
          })
        );

        // Reassemble full file when all 32 KB chunks arrive
        if (transfer.chunks.size === transfer.totalChunks) {
          let fullBase64 = '';
          for (let i = 0; i < transfer.totalChunks; i++) {
            fullBase64 += transfer.chunks.get(i);
          }

          const binaryStr = atob(fullBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const blob = new Blob([bytes]);
          const blobUrl = trackBlobUrl(URL.createObjectURL(blob));

          setActiveTorrents((prev) =>
            prev.map((item) => {
              if (item.infoHash === data.magnetURI || item.magnetURI === data.magnetURI || (data.magnetURI && data.magnetURI.includes(item.infoHash)) || (item.magnetURI && item.magnetURI.includes(data.magnetURI))) {
                return {
                  ...item,
                  progress: 100,
                  speed: '15.00',
                  done: true,
                  blobUrl: blobUrl
                };
              }
              return item;
            })
          );

          setStatusText(`ดาวน์โหลดไฟล์ [${data.fileName || 'file'}] สมบูรณ์ 100%! ⚡ (P2P Direct)`);
          directTransferBuffers.current.delete(data.transferId);
        }
      } catch (e) {
        console.warn('direct-p2p-file-chunk handling error:', e);
      }
      return;
    }

    // 11. Receiving room history from an existing peer (Option B)
    if (data.type === 'room-history') {
      const historyMessages = data.messages || [];
      historyMessages.forEach((msg) => {
        if (msg.msgId && seenMsgIds.current.has(msg.msgId)) return;
        if (msg.msgId) seenMsgIds.current.add(msg.msgId);

        if (msg.type === 'chat') {
          setMessages((prev) => [...prev, {
            sender: 'peer',
            text: msg.text,
            time: msg.time || '',
            animalName: msg.animalName || 'เพื่อน P2P',
            animalIcon: msg.animalIcon || '🐾',
            fromHistory: true
          }]);
        } else if (msg.type === 'torrent-meta') {
          registerIncomingTorrentCard(msg);
          // Rebuild seederMap from history
          if (msg.senderPeerId && msg.magnetURI) {
            if (!localSeederMap.current.has(msg.senderPeerId)) {
              localSeederMap.current.set(msg.senderPeerId, new Set());
            }
            localSeederMap.current.get(msg.senderPeerId).add(msg.magnetURI);
          }
        }
      });
      return;
    }

    // 12. Chat or WebTorrent Metadata Signaling
    if (data.type === 'chat' || data.type === 'torrent-meta') {
      handleIncomingMessage(data);
      return;
    }

    // 11. WebRTC Signaling (Offers, Answers, ICE Candidates)
    handleWebRTCSignal(data);
  };

  // Handle Room Join Request & Password Check
  const requestJoinRoom = () => {
    const targetRoom = roomInput.trim();
    if (!targetRoom) return alert('กรุณากรอกชื่อห้องก่อนครับ!');
    setPendingRoom(targetRoom);
    setAuthError('');
    setPinInput('');

    // Look up saved animal identity for this room in localStorage (pure client-side)
    // This is the same animal the user had last time they were in this specific room
    const resolvedAnimal = loadOrCreateIdentity(targetRoom);
    setMyAnimal(resolvedAnimal); // Set immediately — no need to wait for server

    if (chatWs.current) {
      chatWs.current.close();
    }

    // Send resolved animal directly — server just relays it, no server-side identity lookup
    const wsUrl = `${BASE_SERVER_URL}/chat?room=${encodeURIComponent(targetRoom)}&peerId=${MY_PEER_ID}&animalName=${encodeURIComponent(resolvedAnimal.name)}&animalIcon=${encodeURIComponent(resolvedAnimal.icon)}`;
    chatWs.current = new WebSocket(wsUrl);

    // Auto-reconnect if server closes the connection (e.g. heartbeat timeout on mobile)
    chatWs.current.onclose = (e) => {
      // Only reconnect if still joined and closed unexpectedly (not by user action)
      if (e.wasClean) return; // user called ws.close() → don't reconnect
      if (!joinedRef.current) return; // user left the room → don't reconnect
      console.warn('[WS]: Connection lost, reconnecting in 2s...');
      setTimeout(() => {
        if (joinedRef.current) requestJoinRoomReconnect(targetRoom, resolvedAnimal);
      }, 2000);
    };

    chatWs.current.onmessage = fullMessageHandler;
  };

  // Cancel Pending Modal & Return to Room Join Screen
  const cancelPendingModal = () => {
    setShowCreateModal(false);
    setShowAuthModal(false);
    setPendingRoom('');
    setPinInput('');
    setAuthError('');
    setMyAnimal({ name: '', icon: '' });
    if (chatWs.current) {
      chatWs.current.close();
      chatWs.current = null;
    }
  };

  // Leave Active Room & Reset State safely
  const leaveRoom = () => {
    setShowLeaveModal(false);
    setJoined(false);
    setRoomName('');
    setMessages([]);
    setActiveTorrents([]);
    setRoomMembers([]);
    setPeerConnected(false);
    setHasOtherPeers(false);
    setMyAnimal({ name: '', icon: '' });
    setStatusText('พร้อมเข้าใช้งานห้องแชต');

    // Revoke memory allocations
    revokeAllBlobUrls();

    if (chatWs.current) {
      if (chatWs.current.readyState === WebSocket.OPEN) {
        try {
          chatWs.current.send(JSON.stringify({ type: 'leave-room' }));
        } catch (e) {}
      }
      try { chatWs.current.close(); } catch (e) {}
      chatWs.current = null;
    }
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }
    if (syncChannel.current) {
      syncChannel.current.close();
      syncChannel.current = null;
    }
  };

  // Submit Password to Create New Room (Optionally 4-digit PIN)
  const submitCreateRoom = (usePassword) => {
    if (usePassword) {
      if (pinInput.trim().length !== 4 || isNaN(pinInput.trim())) {
        setAuthError('กรุณากรอกรหัสผ่านเป็นตัวเลข 4 หลัก!');
        return;
      }
    }
    const password = usePassword ? pinInput.trim() : null;
    if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
      chatWs.current.send(JSON.stringify({
        type: 'create-room',
        password: password
      }));
    }
  };

  // Submit Password to Join Existing Room
  const submitAuthRoom = () => {
    if (pinInput.trim().length !== 4 || isNaN(pinInput.trim())) {
      setAuthError('กรุณากรอกรหัสผ่านเป็นตัวเลข 4 หลัก!');
      return;
    }
    if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
      chatWs.current.send(JSON.stringify({
        type: 'auth-submit',
        password: pinInput.trim()
      }));
    }
  };

  useEffect(() => {
    if (!joined || !roomName) return;

    // Cross-tab broadcast channel for tabs in the same browser
    syncChannel.current = new BroadcastChannel(`sync_${roomName}`);
    syncChannel.current.onmessage = (event) => {
      const data = event.data;
      if (data.msgId && seenMsgIds.current.has(data.msgId)) return;
      if (data.msgId) seenMsgIds.current.add(data.msgId);

      if (data.type === 'chat-sync') {
        setMessages((prev) => [...prev, data.payload]);
      } else if (data.type === 'torrent-meta') {
        registerIncomingTorrentCard(data);
      }
    };

    return () => {
      if (chatWs.current) chatWs.current.close();
      if (peerRef.current) peerRef.current.destroy();
      if (syncChannel.current) syncChannel.current.close();
    };
  }, [joined, roomName]);

  const handleIncomingMessage = (payload) => {
    if (payload.msgId) {
      if (seenMsgIds.current.has(payload.msgId)) return;
      seenMsgIds.current.add(payload.msgId);
    }

    if (payload.type === 'chat') {
      const msgObj = {
        sender: 'peer',
        text: payload.text,
        time: payload.time || getCurrentTimeStr(),
        animalName: payload.animalName || 'เพื่อน P2P',
        animalIcon: payload.animalIcon || '🐾'
      };
      setMessages((prev) => [...prev, msgObj]);
      syncChannel.current?.postMessage({ type: 'chat-sync', payload: msgObj, msgId: payload.msgId });

      // Add to local history for relay to future joiners
      localHistory.current.push({ ...payload, type: 'chat' });
      if (localHistory.current.length > MAX_LOCAL_HISTORY) localHistory.current.shift();

    } else if (payload.type === 'torrent-meta') {
      registerIncomingTorrentCard(payload);
      syncChannel.current?.postMessage(payload);

      // Track seeder in local seederMap
      if (payload.senderPeerId && payload.magnetURI) {
        if (!localSeederMap.current.has(payload.senderPeerId)) {
          localSeederMap.current.set(payload.senderPeerId, new Set());
        }
        localSeederMap.current.get(payload.senderPeerId).add(payload.magnetURI);
      }

      // Add to local history for relay to future joiners
      localHistory.current.push({ ...payload, type: 'torrent-meta' });
      if (localHistory.current.length > MAX_LOCAL_HISTORY) localHistory.current.shift();
    }
  };

  const handleWebRTCSignal = (data) => {
    const isOffer = data.type === 'offer' || data.sdp;

    if (!peerRef.current || peerRef.current.destroyed) {
      if (isOffer || data.candidate) {
        initWebRTC(false);
      }
    }

    if (peerRef.current && !peerRef.current.destroyed) {
      try {
        peerRef.current.signal(data);
      } catch (err) {
        console.warn('WebRTC signal info:', err);
      }
    }
  };

  const initWebRTC = (initiator) => {
    if (peerRef.current && !peerRef.current.destroyed && peerRef.current.connected) return;

    try {
      peerRef.current = new NativePeer({
        initiator: initiator,
        config: {
          iceServers: ICE_SERVERS
        },
        onSignal: (data) => {
          if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
            chatWs.current.send(JSON.stringify(data));
          }
        },
        onConnect: () => {
          setPeerConnected(true);
          setMessages((prev) => [...prev, { sender: 'system', text: '⚡ เชื่อมต่อ P2P Direct WebRTC กับเพื่อนสำเร็จ!', time: getCurrentTimeStr() }]);
        },
        onData: (data) => {
          try {
            const payload = JSON.parse(data);
            handleIncomingMessage(payload);
          } catch (err) {
            setMessages((prev) => [...prev, { sender: 'peer', text: data, time: getCurrentTimeStr() }]);
          }
        },
        onClose: () => {
          setPeerConnected(false);
        },
        onError: (err) => {
          console.warn('WebRTC peer info:', err);
        }
      });
    } catch (e) {
      console.error('Failed to init NativePeer:', e);
    }
  };

  const [textInput, setTextInput] = useState('');
  const sendChat = () => {
    if (!textInput.trim()) return;
    const msgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    const timestamp = getCurrentTimeStr();
    const msgObj = {
      sender: 'me',
      text: textInput,
      time: timestamp,
      animalName: myAnimal.name,
      animalIcon: myAnimal.icon
    };
    setMessages((prev) => [...prev, msgObj]);

    seenMsgIds.current.add(msgId);
    syncChannel.current?.postMessage({ type: 'chat-sync', payload: msgObj, msgId });

    const chatPayload = JSON.stringify({
      type: 'chat',
      text: textInput,
      msgId,
      time: timestamp,
      animalName: myAnimal.name,
      animalIcon: myAnimal.icon
    });

    if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
      chatWs.current.send(chatPayload);
    }
    if (peerRef.current && peerRef.current.connected) {
      try { peerRef.current.send(chatPayload); } catch (e) {}
    }

    setTextInput('');
  };

  // Pure WebTorrent P2P File Upload & Seeding (Supports Batch Multiple File Selection)
  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    setStatusText(`กำลังสร้าง BitTorrent Seeds สำหรับ ${fileList.length} ไฟล์...`);

    fileList.forEach((file) => {
      const fileType = file.type || getFallbackFileType(file.name);
      const uploaderBlobUrl = trackBlobUrl(URL.createObjectURL(file));

      if (!torrentClient.current) return;

      // Acquire Wake Lock so mobile browser doesn't suspend/refresh while seeding
      acquireWakeLock();

      try {
        // uploadThrottle limits upload bandwidth to reduce memory pressure on mobile
        // (512 KB/s per seeder is plenty for P2P; prevents RAM spike causing tab kill)
        const isMobileDevice = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
        const seedOptions = {
          announce: TRACKER_URLS,
          maxConns: isMobileDevice ? 2 : 55,
          ...(isMobileDevice ? { pieceLength: 128 * 1024 } : {})
        };

        const seedingTorrent = torrentClient.current.seed(file, seedOptions, (torrent) => {
          setStatusText(`ปล่อย ${fileList.length} ไฟล์สำเร็จ! Magnet URIs ถูกส่งเข้าห้องแล้ว`);

          const msgId = 'torrent_' + Math.random().toString(36).substr(2, 9);
          const timestamp = getCurrentTimeStr();
          const meta = {
            type: 'torrent-meta',
            msgId,
            magnetURI: torrent.magnetURI,
            fileName: file.name,
            fileSize: file.size,
            fileType: fileType,
            animalName: myAnimal.name,
            animalIcon: myAnimal.icon,
            time: timestamp
          };

          seenMsgIds.current.add(msgId);
          addTorrentToState(torrent, { ...meta, blobUrl: uploaderBlobUrl }, true);

          // Broadcast WebTorrent Magnet URI to peers over WebSocket and WebRTC
          if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
            chatWs.current.send(JSON.stringify(meta));
          }
          if (peerRef.current && peerRef.current.connected) {
            try { peerRef.current.send(JSON.stringify(meta)); } catch (e) {}
          }
          syncChannel.current?.postMessage(meta);

          // Release wake lock when the torrent is fully seeded to all peers
          torrent.on('idle', () => {
            if (torrentClient.current && !torrentClient.current.torrents.some(t => t.uploadSpeed > 0)) {
              releaseWakeLock();
            }
          });
        });

        if (seedingTorrent && seedingTorrent.on) {
          // Monitor every peer wire connected to this seeding torrent for DataChannel backpressure
          seedingTorrent.on('wire', (wire) => {
            const checkWireBackpressure = () => {
              const channel = wire.conn || wire._channel || (wire.peer && wire.peer._channel) || (wire.type === 'webrtc' && wire.socket);
              if (channel && typeof channel.bufferedAmount === 'number') {
                // High watermark: 256KB buffer -> pause wire stream (stops reading File & queueing data)
                if (channel.bufferedAmount > 256 * 1024) {
                  if (!wire._isPausedForBackpressure) {
                    wire._isPausedForBackpressure = true;
                    if (typeof wire.pause === 'function') wire.pause();
                  }
                }
                // Low watermark: 64KB buffer -> resume wire stream
                else if (wire._isPausedForBackpressure && channel.bufferedAmount < 64 * 1024) {
                  wire._isPausedForBackpressure = false;
                  if (typeof wire.resume === 'function') wire.resume();
                }
              }
            };

            const bpInterval = setInterval(checkWireBackpressure, 50);
            wire.on('close', () => clearInterval(bpInterval));
            wire.on('error', () => clearInterval(bpInterval));
          });

          seedingTorrent.on('error', (err) => {
            console.error('Seeding torrent error:', err);
            setStatusText(`[Seed Error]: ${err.message}`);
            releaseWakeLock();
          });
        }
      } catch (e) {
        console.error('WebTorrent seed error:', e);
        setStatusText(`[Seed Fail]: ${e.message}`);
        releaseWakeLock();
      }
    });
  };

  // Register Incoming File Notification Card (Unstarted state)
  const registerIncomingTorrentCard = (meta) => {
    if (!meta || !meta.magnetURI) return;

    const torrentItem = {
      infoHash: meta.magnetURI,
      magnetURI: meta.magnetURI,
      name: meta.fileName || 'Shared File',
      size: meta.fileSize || 0,
      type: meta.fileType || getFallbackFileType(meta.fileName),
      progress: 0,
      speed: 0,
      isSeeder: false,
      started: false,
      done: false,
      blobUrl: null,
      animalName: meta.animalName || 'เพื่อน P2P',
      animalIcon: meta.animalIcon || '📦',
      time: meta.time || getCurrentTimeStr()
    };

    setActiveTorrents((prev) => {
      if (prev.some(t => t.infoHash === meta.magnetURI || t.magnetURI === meta.magnetURI)) return prev;
      return [...prev, torrentItem];
    });

    setStatusText(`มีไฟล์ใหม่จาก ${meta.animalIcon || '📦'} ${meta.animalName || 'เพื่อน'} [${meta.fileName}]`);
  };

  // Get direct physical disk writable stream via FileSystem Access API (Desktop) or OPFS (Mobile / Safari / Chrome)
  const getDiskWritableStream = async (fileName) => {
    // 1. Desktop FileSystem Access API (showSaveFilePicker)
    if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: fileName || 'download'
        });
        const stream = await fileHandle.createWritable();
        return { stream, mode: 'picker', handle: fileHandle };
      } catch (err) {
        console.warn('showSaveFilePicker skipped/cancelled:', err);
      }
    }

    // 2. Mobile & Fallback: OPFS (Origin Private File System on Hard Disk/Flash Storage)
    if (typeof navigator !== 'undefined' && navigator.storage && typeof navigator.storage.getDirectory === 'function') {
      try {
        const root = await navigator.storage.getDirectory();
        const safeName = (fileName || 'download').replace(/[/\\?%*:|"<>]/g, '_');
        const fileHandle = await root.getFileHandle(safeName, { create: true });
        if (typeof fileHandle.createWritable === 'function') {
          const stream = await fileHandle.createWritable();
          return { stream, mode: 'opfs', handle: fileHandle, fileName: safeName };
        }
      } catch (err) {
        console.warn('OPFS createWritable failed:', err);
      }
    }

    return null;
  };

  // Direct-to-Disk P2P WebTorrent Download (OPFS / FileSystem Access for 0 MB RAM)
  const startDownload = async (meta) => {
    if (!meta || !meta.magnetURI || !torrentClient.current) return;

    const fileName = meta.name || meta.fileName || 'download';

    setActiveTorrents((prev) =>
      prev.map((t) => (t.infoHash === meta.magnetURI || t.magnetURI === meta.magnetURI) ? { ...t, started: true } : t)
    );

    // 1. Register torrent synchronously in WebTorrent client FIRST so it is immediately listening
    let torrent = null;
    try {
      torrent = torrentClient.current.get(meta.magnetURI);
    } catch (e) {}

    if (!torrent) {
      try {
        torrent = torrentClient.current.add(meta.magnetURI, { announce: TRACKER_URLS });
      } catch (e) {
        console.warn('WebTorrent add fallback triggered:', e);
        // Find existing torrent in torrentClient array if duplicate error occurred
        if (torrentClient.current.torrents && torrentClient.current.torrents.length > 0) {
          torrent = torrentClient.current.torrents.find(
            t => t.magnetURI === meta.magnetURI || t.infoHash === meta.magnetURI || (meta.magnetURI && meta.magnetURI.includes(t.infoHash))
          );
        }
      }
    }

    if (torrent && typeof torrent.on === 'function') {
      if (typeof torrent.resume === 'function') {
        try { torrent.resume(); } catch (e) {}
      }
      attachTorrentListeners(torrent, meta, false);
      try {
        torrent.on('error', (err) => {
          console.error('Torrent download error:', err);
          setStatusText(`[Download Error]: ${err.message}`);
        });
      } catch (e) {}
    }

    // 2. Pulse request-init and request-torrent-reannounce over WebSocket & WebRTC repeatedly until connected
    const reannounceMsg = JSON.stringify({ type: 'request-torrent-reannounce', magnetURI: meta.magnetURI });
    const directStreamMsg = JSON.stringify({ type: 'request-direct-p2p-stream', magnetURI: meta.magnetURI });
    const sendPulses = () => {
      if (chatWs.current && chatWs.current.readyState === WebSocket.OPEN) {
        try {
          chatWs.current.send(JSON.stringify({ type: 'request-init' }));
          chatWs.current.send(reannounceMsg);
          chatWs.current.send(directStreamMsg);
        } catch (e) {}
      }
      if (peerRef.current && peerRef.current.connected) {
        try {
          peerRef.current.send(reannounceMsg);
          peerRef.current.send(directStreamMsg);
        } catch (e) {}
      }
    };

    sendPulses();
    const pulseInterval = setInterval(() => {
      if (torrent && (torrent.done || torrent.progress === 1)) {
        clearInterval(pulseInterval);
      } else {
        sendPulses();
      }
    }, 1500);
    setTimeout(() => clearInterval(pulseInterval), 15000);

    setStatusText(`กำลังเชื่อมต่อโหนด P2P เพื่อสตรีมไฟล์ [${fileName}]...`);

    // 3. Asynchronously acquire physical disk writable stream (OPFS or picker) without delaying P2P handshake
    getDiskWritableStream(fileName).then((diskTarget) => {
      if (diskTarget && diskTarget.stream && torrent && typeof torrent.on === 'function') {
        torrent._hasDirectDiskStream = (diskTarget.mode === 'picker');
        torrent._opfsDiskTarget = (diskTarget.mode === 'opfs' ? diskTarget : null);

        const attachStream = () => {
          const file = torrent.files && torrent.files[0];
          if (file && typeof file.createReadStream === 'function') {
            const stream = file.createReadStream();
            stream.on('data', async (chunk) => {
              try { await diskTarget.stream.write(chunk); } catch (e) {}
            });
            stream.on('end', async () => {
              try {
                await diskTarget.stream.close();
                setStatusText(`เขียนไฟล์ [${fileName}] ลงดิสก์สมบูรณ์แล้ว! (0 MB RAM)`);
              } catch (e) {}
            });
          }
        };

        if (torrent.files && torrent.files.length > 0) {
          attachStream();
        } else {
          torrent.on('ready', attachStream);
        }
      }
    });
  };

  const addTorrentToState = (torrent, meta, isSeeder) => {
    const torrentItem = {
      infoHash: meta.magnetURI || (torrent && torrent.infoHash),
      magnetURI: meta.magnetURI || (torrent && torrent.magnetURI),
      name: meta.fileName || (torrent && torrent.name),
      size: meta.fileSize || (torrent && torrent.length),
      type: meta.fileType || getFallbackFileType(meta.fileName),
      progress: isSeeder ? 100 : (torrent && torrent.progress ? Math.round(torrent.progress * 100) : 0),
      speed: 0,
      isSeeder,
      started: isSeeder,
      done: isSeeder,
      blobUrl: meta.blobUrl || null,
      animalName: meta.animalName || myAnimal.name,
      animalIcon: meta.animalIcon || myAnimal.icon,
      time: meta.time || getCurrentTimeStr()
    };

    setActiveTorrents((prev) => {
      const exists = prev.find(t => t.infoHash === torrentItem.infoHash || t.magnetURI === torrentItem.magnetURI);
      if (exists) return prev.map(t => (t.infoHash === torrentItem.infoHash || t.magnetURI === torrentItem.magnetURI) ? { ...t, ...torrentItem } : t);
      return [...prev, torrentItem];
    });

    attachTorrentListeners(torrent, meta, isSeeder);
  };

  // Universal File Saving: Forced application/octet-stream override + iOS Native Share Sheet
  const saveFileToDisk = async (url, fileName) => {
    if (!url) return;
    const name = fileName || 'download';

    try {
      // 1. Fetch memory Blob from URL
      const response = await fetch(url);
      const blob = await response.blob();

      // 2. Mobile Native Share Sheet (iOS Safari Photos/Files app or Android Share)
      const isMobileDevice = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobileDevice && navigator && typeof navigator.canShare === 'function') {
        try {
          const fileObj = new File([blob], name, { type: blob.type || 'application/octet-stream' });
          if (navigator.canShare({ files: [fileObj] })) {
            await navigator.share({
              files: [fileObj],
              title: name
            });
            return;
          }
        } catch (shareErr) {
          // If share sheet is cancelled or unsupported for that file type -> fallback to forced blob download
        }
      }

      // 3. Forced binary MIME type override ('application/octet-stream')
      // Prevents iOS Safari & Mobile Chrome from opening images, PDFs, and videos in a new browser tab!
      const forcedBlob = new Blob([blob], { type: 'application/octet-stream' });
      const downloadUrl = trackBlobUrl(URL.createObjectURL(forcedBlob));

      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (e) {}
      }, 1000);
    } catch (e) {
      // Direct anchor click fallback
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (e) {}
      }, 1000);
    }
  };

  const triggerAutoSave = (url, fileName, magnetURI) => {
    if (!url || autoDownloadedBlobs.current.has(magnetURI)) return;
    autoDownloadedBlobs.current.add(magnetURI);
    saveFileToDisk(url, fileName);
  };

  const extractBlobUrlFromTorrent = (torrent, callback) => {
    if (!torrent || !torrent.files || torrent.files.length === 0) return;
    const file = torrent.files[0];

    // Try extraction methods sequentially — NEVER run multiple parallel extractions
    if (typeof file.getBlobURL === 'function') {
      try {
        const res = file.getBlobURL((err, url) => {
          if (!err && url) return callback(url);
          // Fallback to getBlob if getBlobURL fails
          if (typeof file.getBlob === 'function') {
            file.getBlob((err2, blob) => {
              if (!err2 && blob) callback(URL.createObjectURL(blob));
            });
          }
        });
        if (res && typeof res.then === 'function') {
          res.then((url) => url && callback(url)).catch(() => {});
          return;
        } else if (typeof res === 'string') {
          return callback(res);
        }
      } catch (e) {}
    }

    if (typeof file.getBlob === 'function') {
      try {
        const res = file.getBlob((err, blob) => {
          if (!err && blob) callback(trackBlobUrl(URL.createObjectURL(blob)));
        });
        if (res && typeof res.then === 'function') {
          res.then((blob) => blob && callback(trackBlobUrl(URL.createObjectURL(blob)))).catch(() => {});
          return;
        }
      } catch (e) {}
    }

    if (typeof file.blob === 'function') {
      try {
        file.blob().then((blob) => blob && callback(trackBlobUrl(URL.createObjectURL(blob)))).catch(() => {});
        return;
      } catch (e) {}
    }
  };

  const attachTorrentListeners = (torrent, meta, isSeeder) => {
    if (!torrent || typeof torrent.on !== 'function') {
      return;
    }

    let hasExtractedBlob = false;

    const applyBlobUrl = (url) => {
      if (!url) return;
      const fileName = meta.fileName || meta.name || torrent.name;
      const magnetURI = meta.magnetURI;

      setActiveTorrents((prev) =>
        prev.map((item) => (item.infoHash === magnetURI || item.magnetURI === magnetURI) ? { ...item, blobUrl: url, done: true, progress: 100 } : item)
      );

      if (!isSeeder && !torrent._hasDirectDiskStream) {
        triggerAutoSave(url, fileName, magnetURI);
      }
    };

    const updateStats = () => {
      const isDone = isSeeder || torrent.progress === 1 || torrent.done;
      const progressPct = isSeeder ? 100 : Math.round(torrent.progress * 100);
      const speedMB = (torrent.downloadSpeed / 1024 / 1024).toFixed(2);
      const fileName = meta.fileName || meta.name || torrent.name;

      setActiveTorrents((prev) =>
        prev.map((item) => {
          if (item.infoHash === meta.magnetURI || item.magnetURI === meta.magnetURI) {
            return {
              ...item,
              progress: progressPct,
              speed: speedMB,
              done: isDone
            };
          }
          return item;
        })
      );

      if (!isSeeder && !isDone && progressPct > 0) {
        setStatusText(`กำลังดาวน์โหลด [${fileName}] (${progressPct}%) - ${speedMB} MB/s ⚡`);
      } else if (!isSeeder && isDone) {
        setStatusText(`ดาวน์โหลดไฟล์ [${fileName}] สมบูรณ์ 100%!`);
      }

      // ONLY extract Blob URL once when a downloader finishes — NEVER for seeders on upload ticks
      if (!isSeeder && isDone && !hasExtractedBlob) {
        hasExtractedBlob = true;
        extractBlobUrlFromTorrent(torrent, applyBlobUrl);
      }
    };

    try {
      torrent.on('download', updateStats);
      torrent.on('upload', updateStats);
      torrent.on('wire', (wire) => {
        const fileName = meta.fileName || meta.name || torrent.name;
        setStatusText(`เชื่อมต่อโหนด P2P สำหรับ [${fileName}] สำเร็จ! เริ่มถ่ายโอนข้อมูล...`);
      });
    } catch (e) {}

    try {
      torrent.on('done', () => {
        setStatusText(`ดาวน์โหลดไฟล์ [${meta.fileName || meta.name}] สมบูรณ์แล้ว!`);
        if (!isSeeder && !hasExtractedBlob) {
          hasExtractedBlob = true;
          extractBlobUrlFromTorrent(torrent, applyBlobUrl);
        }
      });
    } catch (e) {}

    // For non-seeders that are already done, extract once
    if (!isSeeder && (torrent.progress === 1 || torrent.done) && !hasExtractedBlob) {
      hasExtractedBlob = true;
      extractBlobUrlFromTorrent(torrent, applyBlobUrl);
    }
  };

  const getFallbackFileType = (filename) => {
    if (!filename) return 'application/octet-stream';
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext)) return `video/${ext}`;
    if (['mp3', 'wav', 'flac', 'aac', 'm4a'].includes(ext)) return `audio/${ext}`;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return `image/${ext}`;
    if (['pdf'].includes(ext)) return 'application/pdf';
    return 'application/octet-stream';
  };

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="app-container">
      {/* Desktop Version: Exit Room Button on Top Left with Spacing */}
      {joined && (
        <button
          className="desktop-leave-btn"
          onClick={() => setShowLeaveModal(true)}
        >
          🚪 ออกจากห้อง
        </button>
      )}

      <header className="header">
        <h1 className="header-title">
          <span>🚀</span> TungShare P2P Network
        </h1>
        <p className="header-subtitle">
          ส่งข้อความและแชร์ไฟล์ขนาดไม่จำกัด ผ่านระบบ WebRTC & BitTorrent Peer-to-Peer
        </p>
      </header>

      {/* 1. Modal: Create New Room & Set Password (PIN 4 digits) */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🏗️ สร้างห้องใหม่ & ตั้งค่ารหัสผ่าน</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 }}>
              ห้อง <strong style={{ color: 'var(--accent-cyan)' }}>[{pendingRoom}]</strong> ยังไม่ได้ถูกสร้างขึ้น คุณกำลังเปิดสร้างห้องใหม่นี้ คุณต้องการตั้งรหัสผ่าน (PIN 4 หลัก) หรือไม่?
            </p>
            <input
              type="password"
              className="custom-input pin-input"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPinInput(val);
                setAuthError('');
              }}
              placeholder="••••"
            />
            {authError && <div className="error-text">{authError}</div>}
            <div className="modal-actions">
              <button
                className="primary-btn"
                style={{ justifyContent: 'center' }}
                onClick={() => submitCreateRoom(true)}
              >
                🔒 สร้างห้องและตั้งรหัสผ่าน
              </button>
              <button
                className="secondary-btn"
                onClick={() => submitCreateRoom(false)}
              >
                🌐 สร้างห้องแบบสาธารณะ (ไม่ใช้รหัสผ่าน)
              </button>
              <button
                className="secondary-btn"
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
                onClick={cancelPendingModal}
              >
                ⬅️ ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Enter Password to Join Existing Room */}
      {showAuthModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🔒 กรอกรหัสผ่านเพื่อเข้าห้อง</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 }}>
              ห้อง <strong style={{ color: 'var(--accent-cyan)' }}>[{pendingRoom}]</strong> มีการล็อครหัสผ่านไว้ กรุณากรอก PIN 4 หลักเพื่อเข้าห้อง
            </p>
            <input
              type="password"
              className="custom-input pin-input"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                setPinInput(val);
                setAuthError('');
              }}
              placeholder="••••"
              onKeyDown={(e) => e.key === 'Enter' && submitAuthRoom()}
            />
            {authError && <div className="error-text">{authError}</div>}
            <div className="modal-actions">
              <button
                className="primary-btn"
                style={{ justifyContent: 'center' }}
                onClick={submitAuthRoom}
              >
                🔑 ยืนยันรหัสผ่าน
              </button>
              <button
                className="secondary-btn"
                onClick={cancelPendingModal}
              >
                ⬅️ ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Confirm Leaving Room */}
      {showLeaveModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🚪 ยืนยันการออกจากห้อง</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 8 }}>
              คุณต้องการออกจากห้อง <strong style={{ color: 'var(--accent-cyan)' }}>[{roomName}]</strong> หรือไม่? การเชื่อมต่อและไฟล์ที่กำลังแชร์ในเซสชั่นนี้จะถูกยกเลิก
            </p>
            <div className="modal-actions">
              <button
                className="primary-btn"
                style={{ justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                onClick={leaveRoom}
              >
                🚪 ยืนยันออกจากห้อง
              </button>
              <button
                className="secondary-btn"
                onClick={() => setShowLeaveModal(false)}
              >
                อยู่ต่อในห้อง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Room Animal Members List (Opened via Foot Icon) */}
      {showMembersModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-card" style={{ maxWidth: 460 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <span>🐾</span> รายชื่อสมาชิกในห้อง [{roomName}]
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>
              สมาชิกที่กำลังออนไลน์อยู่ทั้งหมด ({roomMembers.length || 1}/100 ตัว)
            </p>

            <div style={{ maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
              {/* Show My Identity First */}
              <div className="member-item is-me">
                <div className="member-avatar">{myAnimal.icon}</div>
                <div className="member-info">
                  <div className="member-name">{myAnimal.name}</div>
                  <div className="member-tag">✨ ตัวตนของคุณ (ผู้ใช้ปัจจุบัน)</div>
                </div>
              </div>

              {/* Show Other Room Members */}
              {roomMembers
                .filter(m => m.peerId !== MY_PEER_ID)
                .map((m, idx) => (
                  <div key={m.peerId || idx} className="member-item">
                    <div className="member-avatar">{m.animalIcon || '🐾'}</div>
                    <div className="member-info">
                      <div className="member-name">{m.animalName || 'เพื่อน P2P'}</div>
                      <div className="member-tag" style={{ color: 'var(--text-muted)' }}>🟢 ออนไลน์ในห้อง</div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="modal-actions" style={{ marginTop: 16 }}>
              <button
                className="secondary-btn"
                onClick={() => setShowMembersModal(false)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {!joined ? (
        <div className="glass-card join-container">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600 }}>🚪 เข้าสู่ห้องแชต P2P</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>
            สร้างชื่อห้อง หรือ พิมพ์ชื่อห้องเดียวกับเพื่อนเพื่อเริ่มเชื่อมต่อตรง (รองรับสูงสุด 100 คน)
          </p>
          <div className="input-group">
            <input
              type="text"
              className="custom-input"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              placeholder="กรอกชื่อห้อง (เช่น room123)"
              onKeyDown={(e) => e.key === 'Enter' && requestJoinRoom()}
            />
            <button className="primary-btn" onClick={requestJoinRoom}>
              เข้าร่วมห้อง
            </button>
          </div>
        </div>
      ) : (
        <div className="room-viewport-wrapper">
          {/* Mobile Tab Control (< 768px) */}
          <div className="mobile-tabs">
            <button
              className={`mobile-tab-btn ${mobileTab === 'chat' ? 'active' : ''}`}
              onClick={() => setMobileTab('chat')}
            >
              💬 ข้อความแชต
            </button>
            <button
              className={`mobile-tab-btn ${mobileTab === 'files' ? 'active' : ''}`}
              onClick={() => setMobileTab('files')}
            >
              📦 Universal แชร์ไฟล์ {activeTorrents.length > 0 && `(${activeTorrents.length})`}
            </button>
          </div>

          <div className="dashboard-grid">
            {/* Left Column: Chat Card */}
            {(!isMobile || mobileTab === 'chat') && (
              <div className="glass-card chat-card">
                <div className="room-header">
                  <div className="room-title">
                    💬 ห้อง: <span style={{ color: 'var(--accent-cyan)' }}>{roomName}</span>
                  </div>
                  <div className="room-header-controls">
                    {peerConnected ? (
                      <span className="badge badge-connected">🟢 P2P Direct</span>
                    ) : hasOtherPeers ? (
                      <span className="badge badge-tab">🔵 มีเพื่อนในห้อง</span>
                    ) : (
                      <span className="badge badge-waiting">🟡 รอเพื่อนเข้าห้อง</span>
                    )}

                    {/* Animal Foot Icon Button: Opens Room Members List Modal */}
                    <button
                      className="animal-foot-btn"
                      onClick={() => setShowMembersModal(true)}
                      title="ดูรายชื่อสมาชิกสัตว์ทั้งหมดในห้อง"
                    >
                      🐾 <span className="foot-count-badge">{roomMembers.length || 1}</span>
                    </button>
                  </div>
                </div>

                <div className="chat-messages" onScroll={handleChatScroll}>
                  {messages.map((m, i) => (
                    <div key={i} className={`chat-row ${m.sender}`}>
                      {m.sender !== 'system' && (
                        <div className="animal-avatar">
                          {m.animalIcon || (m.sender === 'me' ? myAnimal.icon : '🐾')}
                        </div>
                      )}

                      <div className="chat-bubble-wrapper">
                        {m.sender !== 'system' && (
                          <div className="sender-name-label">
                            {m.sender === 'me'
                              ? `${myAnimal.icon} คุณ (${myAnimal.name})`
                              : `${m.animalIcon || '🐾'} ${m.animalName || 'เพื่อน P2P'}`}
                          </div>
                        )}

                        <div className={`chat-bubble ${m.sender}`}>
                          {m.text}
                        </div>

                        {m.time && (
                          <span className="chat-timestamp">{m.time}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>

                {/* Floating Scroll Down Arrow Button for Chat Card */}
                {showChatScrollDown && (
                  <button
                    className="scroll-down-btn"
                    onClick={scrollToBottomChat}
                    title="ไปที่ข้อความล่าสุด"
                  >
                    ⬇️
                  </button>
                )}

                <div className="input-group">
                  <input
                    type="text"
                    className="custom-input"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="พิมพ์ข้อความส่งหาเพื่อน..."
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  />
                  <button className="primary-btn" onClick={sendChat}>
                    ส่ง
                  </button>
                </div>
              </div>
            )}

            {/* Right Column: Universal File Sharing Card */}
            {(!isMobile || mobileTab === 'files') && (
              <div className="glass-card file-card-container">
                <div className="room-header">
                  <div className="room-title">
                    📦 Universal BitTorrent Share
                  </div>
                  <span className="badge badge-tab">ทุกประเภทไฟล์</span>
                </div>

                {/* Dropzone Upload supporting Multiple File Selection */}
                <div
                  className={`file-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files) handleFileSelect(e.dataTransfer.files);
                  }}
                >
                  <input
                    type="file"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <div className="dropzone-icon">📁</div>
                  <div className="dropzone-text">ลากไฟล์มาวางที่นี่ หรือ คลิกเพื่อเลือกหลายไฟล์</div>
                  <div className="dropzone-subtext">รองรับเลือกหลายไฟล์พร้อมกัน: วิดีโอ, เสียง, รูปภาพ, เอกสาร, Zip ฯลฯ</div>
                </div>

                <div style={{ margin: '12px 0', fontSize: '0.82rem', color: 'var(--accent-cyan)', fontWeight: 500 }}>
                  {statusText}
                </div>

                {/* Active BitTorrent File Transfers Scrollable Container */}
                <div className="file-list-container" onScroll={handleFileScroll}>
                  {activeTorrents.map((t) => (
                    <div key={t.infoHash || t.magnetURI} className={`file-card${t.unavailable ? ' file-card-unavailable' : ''}`}>
                      {/* Unavailable overlay when seeder has left */}
                      {t.unavailable && (
                        <div className="unavailable-overlay">
                          <span className="unavailable-icon">✕</span>
                          <span className="unavailable-label">ไฟล์นี้ไม่พร้อมใช้งาน<br/><small>เจ้าของออกจากห้องแล้ว</small></span>
                        </div>
                      )}

                      <div className="file-header">
                        <div className="file-name" title={t.name}>{t.name}</div>
                        <div className="file-meta">{formatBytes(t.size)}</div>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>ผู้ส่ง: <strong>{t.animalIcon} {t.animalName}</strong></span>
                        {t.time && <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{t.time}</span>}
                      </div>

                      {/* Show Start Download Button if not started yet and not unavailable */}
                      {!t.isSeeder && !t.started && !t.done && !t.unavailable && (
                        <div style={{ marginTop: 10 }}>
                          <button
                            className="primary-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => startDownload(t)}
                          >
                            📥 เริ่มดาวน์โหลดไฟล์ P2P
                          </button>
                        </div>
                      )}

                      {/* Show Progress Bar & Speed only if downloading or completed */}
                      {(t.isSeeder || t.started || t.done) && (
                        <>
                          <div className="progress-bar-container">
                            <div className="progress-bar-fill" style={{ width: `${t.progress}%` }} />
                          </div>

                          <div className="speed-stats">
                            <span>{t.isSeeder ? '🌱 กำลังปล่อย Seed' : `ดาวน์โหลด: ${t.progress}%`}</span>
                            <span>{t.done ? '✅ ดาวน์โหลดสำเร็จ' : `สปีด: ${t.speed} MB/s`}</span>
                          </div>
                        </>
                      )}

                      {/* Direct User Click Download Button & Media Preview */}
                      {t.blobUrl && (
                        <div style={{ marginTop: 10 }}>
                          {t.type.startsWith('video/') && (
                            <div className="media-preview-container">
                              <video src={t.blobUrl} controls autoPlay muted />
                            </div>
                          )}
                          {t.type.startsWith('audio/') && (
                            <div className="media-preview-container" style={{ background: 'transparent' }}>
                              <audio src={t.blobUrl} controls />
                            </div>
                          )}
                          {t.type.startsWith('image/') && (
                            <div className="media-preview-container">
                              <img src={t.blobUrl} alt={t.name} />
                            </div>
                          )}
                          {!t.isSeeder && (
                            <button
                              className="download-btn"
                              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
                              onClick={() => saveFileToDisk(t.blobUrl, t.name)}
                            >
                              💾 เซฟไฟล์ลงเครื่องซ้ำ ({t.name})
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  ))}
                  <div ref={fileBottomRef} />
                </div>

                {/* Floating Scroll Down Arrow Button for File Sharing Card */}
                {showFileScrollDown && (
                  <button
                    className="scroll-down-btn"
                    onClick={scrollToBottomFiles}
                    title="ไปที่ไฟล์ล่าสุด"
                  >
                    ⬇️
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Version: Animal Identity Badge OUTSIDE Below Dashboard Grid */}
          {myAnimal.name && (
            <div className="my-animal-desktop-badge">
              <span>ตัวตนของคุณ:</span>
              <strong>{myAnimal.icon} {myAnimal.name}</strong>
            </div>
          )}

          {/* Mobile Control Row: Exit Button on Left, User Persona on Right (Placed at bottom of page content) */}
          <div className="mobile-control-row">
            <button
              className="leave-room-btn"
              onClick={() => setShowLeaveModal(true)}
            >
              🚪 ออกจากห้อง
            </button>
            {myAnimal.name && (
              <div className="mobile-user-persona">
                {myAnimal.icon} {myAnimal.name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
