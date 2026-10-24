'use client';

import React, { useEffect, useRef, useState, Suspense } from 'react';
import ReactDOMServer from 'react-dom/server';
import Link from 'next/link';
import AOS from 'aos';
import {
  Play,
  Ticket,
  Music2,
  Eye,
  EyeOff,
  SkipBack,
  SkipForward,
  List,
} from 'lucide-react';
import {
  FaInstagram,
  FaYoutube,
  FaFacebook,
  FaTwitter,
  FaApple,
} from 'react-icons/fa';
import type * as THREE from 'three';

/* ================================================================
   TYPES
   ================================================================ */
interface Album {
  id: string;
  title: string;
  artist: string;
  img: string;
  audio?: string;
  publishedAt?: string;
}

interface Hero3DProps {
  theme?: {
    heroPoster?: string;
    albums?: Album[];
  };
  t?: (lang: string, key: string) => string;
  lang?: string;
  heroOffset?: number;
}

/* ================================================================
   FALLBACK
   ================================================================ */
const JADO_FALLBACK: Album[] = [
  {
    id: 'wSf3UBKyIUM',
    title: 'Yego Niyo',
    artist: 'JADO SINZA & ESTHER',
    img: 'https://i.ytimg.com/vi/wSf3UBKyIUM/maxresdefault.jpg',
    publishedAt: '2026-09-19T14:04:29Z',
  },
];

/* ================================================================
   SOCIAL LINKS
   ================================================================ */
const SOCIALS = [
  { name: 'YouTube', icon: FaYoutube, url: 'https://www.youtube.com/@jadosinza14' },
  { name: 'Instagram', icon: FaInstagram, url: 'https://www.instagram.com/jadosinza/?hl=en' },
  { name: 'Facebook', icon: FaFacebook, url: 'https://www.facebook.com/jado.sinza/' },
  { name: 'X', icon: FaTwitter, url: 'https://x.com/JadoSinza' },
  { name: 'Apple Music', icon: Music2, url: 'https://music.apple.com/ca/artist/jado-sinza/1667469711' },
];

/* ================================================================
   FLOATING SOCIAL ICONS
   ================================================================ */
const FLOATING_SOCIALS = [
  { key: 'youtube', color: '#FF0000', icon: FaYoutube, url: 'https://www.youtube.com/@jadosinza14', pos: [-13, 7, -4] },
  { key: 'instagram', color: '#E4405F', icon: FaInstagram, url: 'https://www.instagram.com/jadosinza/', pos: [13, 8, -5] },
  { key: 'facebook', color: '#1877F2', icon: FaFacebook, url: 'https://www.facebook.com/jado.sinza/', pos: [-11, 3, 6] },
  { key: 'x', color: '#000000', icon: FaTwitter, url: 'https://x.com/JadoSinza', pos: [12, 4, 5] },
  { key: 'apple', color: '#FA243C', icon: FaApple, url: 'https://music.apple.com/ca/artist/jado-sinza/1667469711', pos: [0, 10, 4] },
];

/* ================================================================
   Easing helpers (plain JS, used by the 3D scene)
   ================================================================ */
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const easeOutElastic = (t: number) => {
  if (t === 0 || t === 1) return t;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

/* ================================================================
   Eyebrow
   ================================================================ */
function Eyebrow({
  children,
  className = '',
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-[0.25em] ${className}`}
      {...rest}
    >
      {children}
    </p>
  );
}

/* ================================================================
   THREE.JS SCENE
   ================================================================ */
function ThreeScene({
  albums,
  onAlbumClick,
}: {
  albums: Album[];
  onAlbumClick: (album: Album) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onAlbumClickRef = useRef(onAlbumClick);

  useEffect(() => {
    onAlbumClickRef.current = onAlbumClick;
  }, [onAlbumClick]);

  useEffect(() => {
    let animationId = 0;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
      const { CSS2DRenderer } = await import(
        'three/examples/jsm/renderers/CSS2DRenderer.js'
      );

      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;

      const sceneStart = performance.now();

      /* ---------- Scene ---------- */
      const scene = new THREE.Scene();
      scene.background = null;
      scene.fog = new THREE.FogExp2(0x0a0808, 0.004);

      /* ---------- Camera ---------- */
      const camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      );
      const camFrom = { y: 4, z: 8 };
      const camTo = { y: 8.5, z: 24 };
      const camDelay = 200;
      const camDuration = 2200;
      camera.position.set(0, camFrom.y, camFrom.z);

      /* ---------- Renderer ---------- */
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
      });
      renderer.setClearColor(0x000000, 0);
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.style.position = 'absolute';
      renderer.domElement.style.inset = '0';
      renderer.domElement.style.zIndex = '1';
      container.appendChild(renderer.domElement);

      /* ---------- CSS2D ---------- */
      const labelRenderer = new CSS2DRenderer();
      labelRenderer.setSize(container.clientWidth, container.clientHeight);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      labelRenderer.domElement.style.zIndex = '2';
      container.appendChild(labelRenderer.domElement);

      /* ---------- Controls ---------- */
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.25;
      controls.enableZoom = true;
      controls.zoomSpeed = 1.2;
      controls.maxDistance = 55;
      controls.minDistance = 6;
      controls.target.set(0, 2.5, 0);
      controls.enablePan = false;

      /* ---------- User interaction: stop intro ---------- */
      let userInteracted = false;
      const markInteracted = () => {
        userInteracted = true;
      };
      controls.addEventListener('start', markInteracted);
      renderer.domElement.addEventListener('wheel', markInteracted, {
        passive: true,
      });
      renderer.domElement.addEventListener('touchstart', markInteracted, {
        passive: true,
      });

      /* ---------- Lights ---------- */
      scene.add(new THREE.AmbientLight(0xffffff, 0.9));

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 10, 7);
      scene.add(dirLight);

      const boneLight = new THREE.PointLight(0xf7dedd, 0.7, 80);
      boneLight.position.set(-10, -5, 10);
      scene.add(boneLight);

      const coolLight = new THREE.PointLight(0xa0c0ff, 0.5, 80);
      coolLight.position.set(10, 8, -10);
      scene.add(coolLight);

      /* ---------- Starfield ---------- */
      const starGeo = new THREE.BufferGeometry();
      const starCount = 600;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 400;
        starPos[i + 1] = (Math.random() - 0.5) * 400;
        starPos[i + 2] = (Math.random() - 0.5) * 400;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.13,
        transparent: true,
        opacity: 0,
      });
      const stars = new THREE.Points(starGeo, starMat);
      scene.add(stars);

      /* ---------- Dust ---------- */
      const dustCount = 200;
      const dustGeo = new THREE.BufferGeometry();
      const dustPos = new Float32Array(dustCount * 3);
      const dustCol = new Float32Array(dustCount * 3);
      const dustData: {
        baseX: number;
        baseY: number;
        baseZ: number;
        speed: number;
        phase: number;
      }[] = [];

      for (let i = 0; i < dustCount; i++) {
        const radius = 12 + Math.random() * 22;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        const x = radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
        const z = radius * Math.cos(phi);

        dustPos[i * 3] = x;
        dustPos[i * 3 + 1] = y;
        dustPos[i * 3 + 2] = z;

        const color = new THREE.Color().setHSL(0.08, 0.05, 0.7 + Math.random() * 0.25);
        dustCol[i * 3] = color.r;
        dustCol[i * 3 + 1] = color.g;
        dustCol[i * 3 + 2] = color.b;

        dustData.push({
          baseX: x,
          baseY: y,
          baseZ: z,
          speed: 0.5 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
        });
      }
      dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
      dustGeo.setAttribute('color', new THREE.BufferAttribute(dustCol, 3));
      const dustMat = new THREE.PointsMaterial({
        size: 0.14,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const dustParticles = new THREE.Points(dustGeo, dustMat);
      scene.add(dustParticles);

      /* ---------- Album Squares ---------- */
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');
      const albumMeshes: THREE.Mesh[] = [];
      const allInteractive: THREE.Object3D[] = [];

      const displayAlbums = albums.slice(0, 6);

      displayAlbums.forEach((album, index) => {
        const planeGeo = new THREE.PlaneGeometry(3.6, 3.6);
        const texture = textureLoader.load(album.img);
        texture.colorSpace = THREE.SRGBColorSpace;

        const planeMat = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: false,
          toneMapped: false,
        });

        const plane = new THREE.Mesh(planeGeo, planeMat);

        const angle = (index / displayAlbums.length) * Math.PI * 2;
        const radius = 9;
        plane.position.x = Math.cos(angle) * radius;
        plane.position.z = Math.sin(angle) * radius;
        plane.position.y = 2.5 + Math.sin(index * 1.3) * 1.2;

        plane.lookAt(0, plane.position.y, 0);

        plane.userData = {
          type: 'album',
          albumData: album,
          originalPos: plane.position.clone(),
          floatOffset: Math.random() * Math.PI * 2,
          floatAmp: 0.4,
          floatSpeed: 0.005,
          popStart: performance.now() + 600 + index * 150,
          popDuration: 1100,
          popEase: 'back',
          hover: 1,
        };

        plane.scale.setScalar(0);

        scene.add(plane);
        albumMeshes.push(plane);
        allInteractive.push(plane);

        const frameGeo = new THREE.EdgesGeometry(planeGeo);
        const frameMat = new THREE.LineBasicMaterial({
          color: 0xf7dedd,
          transparent: true,
          opacity: 0.7,
        });
        const frame = new THREE.LineSegments(frameGeo, frameMat);
        plane.add(frame);
      });

      /* ---------- Floating Social Icons ---------- */
      const makeIconTexture = (IconComponent: any, bgColor: string) => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = bgColor;
        ctx.beginPath();
        const r = size * 0.28;
        ctx.moveTo(r, 0);
        ctx.lineTo(size - r, 0);
        ctx.quadraticCurveTo(size, 0, size, r);
        ctx.lineTo(size, size - r);
        ctx.quadraticCurveTo(size, size, size - r, size);
        ctx.lineTo(r, size);
        ctx.quadraticCurveTo(0, size, 0, size - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.fill();

        const iconEl = IconComponent({ size: 140, color: '#ffffff' });
        const iconSvg = ReactDOMServer.renderToStaticMarkup(iconEl);
        const blob = new Blob([iconSvg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const img = new Image();
        img.src = url;

        return new Promise<THREE.Texture>((resolve) => {
          img.onload = () => {
            const pad = (size - 160) / 2;
            ctx.drawImage(img, pad, pad, 160, 160);
            URL.revokeObjectURL(url);

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            resolve(tex);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(new THREE.CanvasTexture(canvas));
          };
        });
      };

      const socialMeshes: THREE.Mesh[] = [];

      Promise.all(
        FLOATING_SOCIALS.map(async (social) => {
          const tex = await makeIconTexture(social.icon, social.color);
          if (cancelled) return;
          const geo = new THREE.PlaneGeometry(1.4, 1.4);
          const mat = new THREE.MeshBasicMaterial({
            map: tex,
            transparent: true,
            side: THREE.DoubleSide,
            toneMapped: false,
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(social.pos[0], social.pos[1], social.pos[2]);
          mesh.userData = {
            type: 'social',
            url: social.url,
            originalPos: mesh.position.clone(),
            floatOffset: Math.random() * Math.PI * 2,
            floatAmp: 0.35,
            floatSpeed: 0.004,
            popStart: performance.now() + 1200 + Math.random() * 600,
            popDuration: 1200,
            popEase: 'elastic',
            hover: 1,
          };

          mesh.scale.setScalar(0);

          scene.add(mesh);
          socialMeshes.push(mesh);
          allInteractive.push(mesh);
        })
      );

      /* ---------- Center Glow ---------- */
      const centerMat = new THREE.MeshBasicMaterial({
        color: 0xf7dedd,
        transparent: true,
        opacity: 0.06,
        wireframe: true,
      });
      const centerSphere = new THREE.Mesh(
        new THREE.SphereGeometry(1.6, 24, 24),
        centerMat
      );
      centerSphere.position.set(0, 2.5, 0);
      scene.add(centerSphere);

      /* ---------- Raycaster ---------- */
      const raycaster = new THREE.Raycaster();
      const mouseNDC = new THREE.Vector2(0, 0);
      let hoveredObj: THREE.Object3D | null = null;

      const handleMouseMove = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouseNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const handleClick = () => {
        raycaster.setFromCamera(mouseNDC, camera);
        const intersects = raycaster.intersectObjects(allInteractive, true);
        if (intersects.length > 0) {
          let obj: THREE.Object3D | null = intersects[0].object;
          while (obj && !obj.userData.type) obj = obj.parent;
          if (!obj) return;

          if (obj.userData.type === 'album') {
            onAlbumClickRef.current(obj.userData.albumData as Album);
          } else if (obj.userData.type === 'social') {
            window.open(obj.userData.url, '_blank', 'noopener,noreferrer');
          }
        }
      };

      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('click', handleClick);

      /* ---------- Scale (pop-in * hover) ---------- */
      const applyScale = (obj: THREE.Object3D, now: number) => {
        const ud = obj.userData;
        const raw = clamp01((now - ud.popStart) / ud.popDuration);
        const eased =
          ud.popEase === 'elastic' ? easeOutElastic(raw) : easeOutBack(raw);
        const pop = raw <= 0 ? 0 : eased;

        const targetHover = obj === hoveredObj ? 1.12 : 1;
        ud.hover += (targetHover - ud.hover) * 0.15;

        obj.scale.setScalar(Math.max(0.0001, pop * ud.hover));
      };

      /* ---------- Animate ---------- */
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        const now = performance.now();
        const elapsed = now * 0.001;

        /* Camera intro pull-back */
        if (!userInteracted) {
          const t = clamp01((now - sceneStart - camDelay) / camDuration);
          const e = easeOutCubic(t);
          camera.position.y = camFrom.y + (camTo.y - camFrom.y) * e;
          camera.position.z = camFrom.z + (camTo.z - camFrom.z) * e;
        }

        /* Stars + dust fade-in */
        starMat.opacity = 0.5 * clamp01((now - sceneStart) / 2500);
        dustMat.opacity = 0.4 * clamp01((now - sceneStart - 500) / 2500);

        /* Dust motion */
        const positions = dustParticles.geometry.attributes.position as THREE.BufferAttribute;
        const arr = positions.array as Float32Array;
        const mX = mouseNDC.x * 18;
        const mY = mouseNDC.y * 18;

        for (let i = 0; i < dustData.length; i++) {
          const d = dustData[i];
          const floatY = Math.sin(elapsed * d.speed + d.phase) * 0.6;
          const dx = d.baseX - mX;
          const dy = d.baseY - mY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let pushX = 0;
          let pushY = 0;
          if (dist < 12 && dist > 0.1) {
            const force = (12 - dist) / 12;
            pushX = (dx / dist) * force * 2;
            pushY = (dy / dist) * force * 2;
          }

          arr[i * 3] = d.baseX + pushX;
          arr[i * 3 + 1] = d.baseY + floatY + pushY;
          arr[i * 3 + 2] =
            d.baseZ + Math.cos(elapsed * d.speed * 0.5 + d.phase) * 0.4;
        }
        positions.needsUpdate = true;

        /* Float */
        albumMeshes.forEach((plane) => {
          const ud = plane.userData;
          const offset =
            Math.sin(elapsed * ud.floatSpeed * 10 + ud.floatOffset) * ud.floatAmp;
          plane.position.y = ud.originalPos.y + offset;
        });

        socialMeshes.forEach((s) => {
          const ud = s.userData;
          const offset =
            Math.sin(elapsed * ud.floatSpeed * 10 + ud.floatOffset) * ud.floatAmp;
          s.position.y = ud.originalPos.y + offset;
        });

        /* Hover detection */
        raycaster.setFromCamera(mouseNDC, camera);
        const intersects = raycaster.intersectObjects(allInteractive, true);
        let hoverType: string | null = null;
        let hit: THREE.Object3D | null = null;
        if (intersects.length > 0) {
          let o: THREE.Object3D | null = intersects[0].object;
          while (o && !o.userData.type) o = o.parent;
          if (o) {
            hoverType = o.userData.type;
            hit = o;
          }
        }
        hoveredObj = hit;

        renderer.domElement.style.cursor =
          hoverType === 'album' || hoverType === 'social' ? 'pointer' : 'grab';

        /* Apply pop-in + hover scale */
        albumMeshes.forEach((m) => applyScale(m, now));
        socialMeshes.forEach((m) => applyScale(m, now));

        stars.rotation.y += 0.00006;
        centerSphere.rotation.y += 0.002;
        centerSphere.scale.setScalar(1 + Math.sin(elapsed * 1.5) * 0.05);

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };

      animate();

      /* ---------- Resize ---------- */
      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        labelRenderer.setSize(w, h);
      };
      window.addEventListener('resize', handleResize);

      /* ---------- Cleanup ---------- */
      cleanup = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('click', handleClick);
        renderer.domElement.removeEventListener('wheel', markInteracted);
        renderer.domElement.removeEventListener('touchstart', markInteracted);
        controls.removeEventListener('start', markInteracted);
        controls.dispose();
        renderer.dispose();
        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
        if (container.contains(labelRenderer.domElement)) {
          container.removeChild(labelRenderer.domElement);
        }
      };
    };

    init();

    return () => {
      cancelled = true;
      if (cleanup) cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="absolute inset-0" />;
}

/* ================================================================
   MUSIC MODAL (AOS animated)
   ================================================================ */
function MusicModal({
  album,
  albums,
  onClose,
  onNavigate,
}: {
  album: Album | null;
  albums: Album[];
  onClose: () => void;
  onNavigate: (album: Album) => void;
}) {
  const [showAll, setShowAll] = useState(false);

  // Reset the "all" panel when album changes
  useEffect(() => {
    setShowAll(false);
  }, [album?.id]);

  // Tell AOS about the freshly mounted modal elements
  useEffect(() => {
    if (!album) return;
    const id = window.setTimeout(() => AOS.refreshHard(), 30);
    return () => window.clearTimeout(id);
  }, [album?.id, !!album]);

  // Tell AOS about the song list when it opens
  useEffect(() => {
    if (!showAll) return;
    const id = window.setTimeout(() => AOS.refreshHard(), 30);
    return () => window.clearTimeout(id);
  }, [showAll]);

  if (!album) return null;

  const currentIndex = albums.findIndex((a) => a.id === album.id);
  const total = albums.length;

  const goPrev = () => {
    if (total === 0) return;
    const idx = currentIndex <= 0 ? total - 1 : currentIndex - 1;
    onNavigate(albums[idx]);
  };

  const goNext = () => {
    if (total === 0) return;
    const idx = currentIndex >= total - 1 ? 0 : currentIndex + 1;
    onNavigate(albums[idx]);
  };

  const youtubeEmbed = `https://www.youtube-nocookie.com/embed/${album.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-6"
      onClick={onClose}
      data-aos="fade"
      data-aos-duration="350"
      data-aos-once="true"
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden bg-gradient-to-br from-[#0a0808]/95 to-[#1a1010]/95 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.7)]"
        onClick={(e) => e.stopPropagation()}
        style={{ borderRadius: '24px' }}
        data-aos="zoom-in-up"
        data-aos-duration="600"
        data-aos-once="true"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-2xl leading-none text-white backdrop-blur transition-all hover:rotate-90 hover:bg-white/10"
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-4 sm:p-5">
          {/* YouTube Embed */}
          <div
            className="relative mb-4 aspect-video w-full overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)]"
            data-aos="fade-up"
            data-aos-delay="150"
            data-aos-once="true"
          >
            <iframe
              src={youtubeEmbed}
              title={album.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>

          {/* Row: title + artist | prev/next | all | socials */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              key={album.id}
              className="min-w-0 flex-1"
              data-aos="fade-left"
              data-aos-delay="250"
              data-aos-once="true"
            >
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {album.title}
              </h2>
              <p className="text-xs sm:text-sm text-white/60 mt-1">
                {album.artist}
              </p>
            </div>

            <div
              className="flex items-center gap-2 shrink-0"
              data-aos="fade-up"
              data-aos-delay="350"
              data-aos-once="true"
            >
              <button
                onClick={goPrev}
                title="Previous song"
                aria-label="Previous song"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
              >
                <SkipBack size={14} />
              </button>

              <button
                onClick={goNext}
                title="Next song"
                aria-label="Next song"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
              >
                <SkipForward size={14} />
              </button>

              <button
                onClick={() => setShowAll((v) => !v)}
                title="All songs"
                aria-label="All songs"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
              >
                <List size={14} />
              </button>

              <span className="hidden sm:inline text-[10px] uppercase tracking-widest text-white/40 ml-1 mr-1">
                Follow
              </span>

              {SOCIALS.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={s.name}
                    aria-label={s.name}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition-all hover:bg-white/20 hover:text-white hover:scale-110"
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* All songs list */}
          {showAll && (
            <div
              className="mt-4 max-h-56 overflow-y-auto bg-white/5 backdrop-blur-md"
              style={{
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              data-aos="fade-down"
              data-aos-duration="400"
              data-aos-once="true"
            >
              <ul className="py-1">
                {albums.map((a, i) => {
                  const isActive = a.id === album.id;
                  return (
                    <li
                      key={a.id}
                      data-aos="fade-right"
                      data-aos-delay={i * 60}
                      data-aos-duration="400"
                      data-aos-once="true"
                    >
                      <button
                        onClick={() => onNavigate(a)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-all ${
                          isActive
                            ? 'text-white bg-white/10'
                            : 'text-white/70 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`w-5 text-center text-[10px] tabular-nums ${
                            isActive ? 'text-white/80' : 'text-white/30'
                          }`}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={a.img}
                          alt=""
                          className="h-8 w-8 shrink-0 object-cover"
                          style={{ borderRadius: '6px' }}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {a.title}
                        </span>
                        {isActive && (
                          <span className="text-[10px] uppercase tracking-widest text-white/40">
                            Playing
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN HERO
   ================================================================ */
export default function Hero3D({ theme, t, lang = 'en', heroOffset = 0 }: Hero3DProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albums, setAlbums] = useState<Album[]>(theme?.albums ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!theme?.albums);
  const [fxEnabled, setFxEnabled] = useState<boolean>(true);

  /* ---------- Load albums ---------- */
  useEffect(() => {
    if (theme?.albums) return;
    let cancelled = false;

    const load = async () => {
      let list: Album[] = [];

      try {
        const res = await fetch('/api/youtube', { cache: 'no-store' });
        const data = await res.json();
        if (data?.videos?.length) {
          list = data.videos.slice(0, 6).map((v: any) => ({
            id: v.id,
            title: v.title,
            artist: v.artist || 'JADO SINZA & ESTHER',
            img: v.thumb,
            publishedAt: v.publishedAt,
          }));
        }
      } catch (e) {
        console.warn('YouTube fetch failed, using fallback', e);
      }

      if (!list.length) list = JADO_FALLBACK;

      if (!cancelled) {
        setAlbums(list);
        setLoaded(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [theme?.albums]);

  const translate = (key: string) =>
    t ? t(lang, key) : key === 'hero.cta1' ? 'Listen Now' : 'Get Tickets';

  return (
    <>
      <style>{`
        @keyframes heroKenBurns { from { transform: scale(1.15); } to { transform: scale(1); } }
        @keyframes heroGlow {
          0%, 100% { text-shadow: 0 0 0 rgba(247,222,221,0); }
          50% { text-shadow: 0 0 24px rgba(247,222,221,0.55); }
        }
        .hero-video { animation: heroKenBurns 8s ease-out both; }
        .hero-accent { animation: heroGlow 4.4s ease-in-out infinite; }
      `}</style>

      <section className="relative min-h-[100svh] overflow-hidden bg-ink">
        {/* LAYER 0: Video */}
        <div
          ref={heroRef}
          className="absolute inset-0 z-0"
          style={{ transform: `translate3d(0, ${heroOffset}px, 0)` }}
        >
          <video
            className="hero-video h-full w-full object-cover object-center"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={theme?.heroPoster || '/images/hero-stage.jpg'}
            src="/video/hero.mp4"
          />
        </div>

        {/* LAYER 1: Overlays */}
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(10,8,8,0.78)_0%,rgba(10,8,8,0.55)_38%,rgba(10,8,8,0.88)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_90%_at_10%_20%,rgba(193,18,31,0.25)_0%,transparent_60%)] mix-blend-multiply" />

        {/* LAYER 2: 3D */}
        {fxEnabled && (
          <div className="absolute inset-0 z-[2]">
            <Suspense fallback={null}>
              {loaded && albums.length > 0 && (
                <ThreeScene
                  key={albums.map((a) => a.id).join('|')}
                  albums={albums}
                  onAlbumClick={setSelectedAlbum}
                />
              )}
            </Suspense>
          </div>
        )}

        {/* LAYER 3: Content */}
        <div className="pointer-events-none relative z-10 mx-auto flex min-h-[100svh] max-w-[1600px] flex-col justify-end px-5 pb-16 pt-32 sm:px-8 lg:pl-24 lg:pr-10">
          <div className="pointer-events-auto">
            <Eyebrow
              className="text-white/70"
              data-aos="fade-up"
              data-aos-duration="900"
            >
              Discover our music, get concert tickets and explore our work.
            </Eyebrow>

            <h1 className="display-xl mt-6 max-w-[15ch] font-display !text-4xl text-white sm:!text-5xl lg:!text-6xl">
              <span
                className="inline-block"
                data-aos="fade-up"
                data-aos-delay="150"
                data-aos-duration="1000"
              >
                Sinza
              </span>{' '}
              <span
                className="inline-block"
                data-aos="fade-up"
                data-aos-delay="300"
                data-aos-duration="1000"
              >
                Universal
              </span>{' '}
              <span
                className="inline-block"
                data-aos="fade-up"
                data-aos-delay="450"
                data-aos-duration="1000"
              >
                <span
                  className="hero-accent italic-voice inline-block"
                  style={{ color: '#F7DEDD' }}
                >
                  Company
                </span>
              </span>
            </h1>

            <div className="mt-9 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div data-aos="zoom-in" data-aos-delay="650" data-aos-duration="800">
                  <Link href="/music" className="btn btn-primary">
                    <Play size={16} fill="currentColor" />
                    {translate('hero.cta1')}
                  </Link>
                </div>
                <div data-aos="zoom-in" data-aos-delay="800" data-aos-duration="800">
                  <Link href="/concerts" className="btn btn-bone">
                    <Ticket size={16} />
                    {translate('hero.cta2')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FX Toggle: wrapper handles centering so AOS's transform doesn't conflict */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <div data-aos="fade-up" data-aos-delay="1000" data-aos-duration="800">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setFxEnabled((v) => !v);
              }}
              aria-label={fxEnabled ? 'Hide 3D' : 'Show 3D'}
              title={fxEnabled ? 'Hide 3D' : 'Show 3D'}
              className="pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-medium tracking-wider text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md transition-all hover:scale-105 hover:bg-black/90 active:scale-95"
            >
              {fxEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{fxEnabled ? 'Hide 3D' : 'Show 3D'}</span>
            </button>
          </div>
        </div>
      </section>

      <MusicModal
        album={selectedAlbum}
        albums={albums}
        onClose={() => setSelectedAlbum(null)}
        onNavigate={(a) => setSelectedAlbum(a)}
      />
    </>
  );
}