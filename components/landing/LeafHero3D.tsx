/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { useEffect, useRef, useState } from "react";

const LeafHero3D = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setLoadingProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const texturesRef = useRef<THREE.Texture[]>([]);
  const currentFrameRef = useRef(0);
  const lastTimeRef = useRef(0);
  const sequencePlaneRef = useRef<THREE.Mesh<
    THREE.PlaneGeometry,
    THREE.MeshBasicMaterial
  > | null>(null);
  const leafModelRef = useRef<THREE.Object3D | null>(null);
  const hasAnimatedRef = useRef(false);
  const isLoadedRef = useRef(false);
  const transitionStartTimeRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const glowPlaneRef = useRef<THREE.Mesh | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const targetRotationRef = useRef({ x: 0, y: 0 });
  const initialLeafPositionRef = useRef({ x: 0.1, y: 0.2, z: 0 });
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current; // Capture for cleanup
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- 1. SETUP THREE.JS ---
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup - VALUES FROM BLENDER (converted to Three.js coordinate system)
    // Blender Camera: Position (4.8868, -3.80109, 1.71783), Rotation (73.2°, 0°, 52.4°), Focal 50mm
    // Blender Z-up → Three.js Y-up conversion applied
    const CAMERA_FOV = 39.6; // Calculated from 50mm focal length with 36mm sensor
    const CAMERA_POSITION = { x: 4.8868, y: 1.71783, z: 3.80109 }; // Converted from Blender

    const camera = new THREE.PerspectiveCamera(
      CAMERA_FOV,
      width / height,
      0.1,
      1000,
    );

    // Apply camera position
    camera.position.set(
      CAMERA_POSITION.x,
      CAMERA_POSITION.y,
      CAMERA_POSITION.z,
    );

    // Point camera at the leaf (at origin)
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Mouse parallax effect - track mouse movement
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse position to -1 to 1 range
      mousePositionRef.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
      };
    };

    // Scroll effect - track scroll for leaf falling animation
    const handleScroll = () => {
      // Calculate scroll progress (0 to 1, capped at 3 screen heights for full fall)
      const maxScroll = window.innerHeight * 3; // Leaf fully falls after 3 screen heights
      scrollProgressRef.current = Math.min(window.scrollY / maxScroll, 1);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Point light for the glow effect ONLY (appears after transition)
    const pointLight = new THREE.PointLight(0xa0ff80, 0);
    pointLight.position.set(0.1, 0.2, -0.5);
    scene.add(pointLight);
    glowLightRef.current = pointLight;

    // --- 2. LOADING MANAGER (CHÌA KHÓA VẤN ĐỀ) ---
    const manager = new THREE.LoadingManager();

    const rgbeLoader = new RGBELoader(manager); // <--- QUAN TRỌNG: Truyền manager vào đây
    rgbeLoader.load("/hdri/studio_kominka.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      // scene.background = texture;
    });

    // Cập nhật % loading
    manager.onProgress = (url, itemsLoaded, itemsTotal) => {
      const progress = Math.round((itemsLoaded / itemsTotal) * 100);
      setLoadingProgress(progress);
    };

    // Khi tải xong TẤT CẢ (Ảnh + Model)
    manager.onLoad = () => {
      console.log("All assets loaded!");
      isLoadedRef.current = true; // Use ref instead of state to avoid re-render
      setIsLoaded(true);
    };

    // --- 3. LOAD ASSETS ---
    const textureLoader = new THREE.TextureLoader(manager);
    const gltfLoader = new GLTFLoader(manager);
    const totalFrames = 200;

    // Load Sequence PNG
    const loadedTextures: THREE.Texture[] = [];
    for (let i = 1; i <= totalFrames; i++) {
      const frameNumber = i.toString().padStart(4, "0");
      // Dùng manager để theo dõi tiến độ
      textureLoader.load(`/textures/sequence/${frameNumber}.png`, (txt) => {
        // Đảm bảo thứ tự mảng đúng với frame (vì load bất đồng bộ)
        txt.colorSpace = THREE.SRGBColorSpace; // Quan trọng để màu không bị nhạt
        loadedTextures[i - 1] = txt;
      });
    }
    // Lưu ý: loadedTextures sẽ là mảng rỗng ban đầu, nhưng khi onLoad chạy thì nó đã đầy
    texturesRef.current = loadedTextures;

    // Tạo Plane (FIX TỶ LỆ)
    // Giả sử ảnh render ra là 1920x1080 (16:9)
    const aspect = 1920 / 1080;
    const planeHeight = 5;
    const planeWidth = planeHeight * aspect; // Tự tính chiều ngang

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    // Khởi tạo material trong suốt
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0, // Ẩn lúc đầu
      toneMapped: false, // Disable tone mapping to match rendered sequence brightness
    });

    const sequencePlane = new THREE.Mesh(geometry, material);
    sequencePlaneRef.current = sequencePlane;

    // Make the plane face the camera
    // Calculate the direction from camera to origin
    // const cameraDirection = new THREE.Vector3(0, 0, 0)
    //   .sub(camera.position)
    //   .normalize();

    // Position the plane at the origin (where the leaf will be)
    sequencePlane.position.set(0, 0, 0);

    // Make the plane look at the camera (so it faces the camera)
    sequencePlane.lookAt(camera.position);

    scene.add(sequencePlane);

    // Create glow effect plane (behind the leaf) - Light rays burst effect
    // const createGlowTexture = () => {
    //   const canvas = document.createElement("canvas");
    //   canvas.width = 1024;
    //   canvas.height = 1024;
    //   const ctx = canvas.getContext("2d");

    //   if (ctx) {
    //     const centerX = 512;
    //     const centerY = 512;

    //     // Clear canvas
    //     ctx.fillStyle = "rgba(0, 0, 0, 0)";
    //     ctx.fillRect(0, 0, 1024, 1024);

    //     // Draw light rays radiating from center
    //     const numRays = 64; // Number of light beams
    //     const rayLength = 512;

    //     for (let i = 0; i < numRays; i++) {
    //       const angle = (i / numRays) * Math.PI * 2;
    //       const rayWidth = 8 + Math.random() * 12; // Varying widths
    //       const rayOpacity = 0.15 + Math.random() * 0.25; // Varying opacity

    //       // Create gradient for each ray
    //       const gradient = ctx.createLinearGradient(
    //         centerX,
    //         centerY,
    //         centerX + Math.cos(angle) * rayLength,
    //         centerY + Math.sin(angle) * rayLength,
    //       );

    //       gradient.addColorStop(0, `rgba(200, 255, 220, ${rayOpacity})`);
    //       gradient.addColorStop(
    //         0.5,
    //         `rgba(120, 220, 150, ${rayOpacity * 0.5})`,
    //       );
    //       gradient.addColorStop(1, "rgba(80, 180, 120, 0)");

    //       // Draw the ray
    //       ctx.beginPath();
    //       ctx.moveTo(centerX, centerY);
    //       ctx.lineTo(
    //         centerX + Math.cos(angle - 0.05) * rayLength,
    //         centerY + Math.sin(angle - 0.05) * rayLength,
    //       );
    //       ctx.lineTo(
    //         centerX + Math.cos(angle + 0.05) * rayLength,
    //         centerY + Math.sin(angle + 0.05) * rayLength,
    //       );
    //       ctx.closePath();
    //       ctx.fillStyle = gradient;
    //       ctx.fill();
    //     }

    //     // Add central glow
    //     const centerGlow = ctx.createRadialGradient(
    //       centerX,
    //       centerY,
    //       0,
    //       centerX,
    //       centerY,
    //       150,
    //     );
    //     centerGlow.addColorStop(0, "rgba(220, 255, 230, 0.6)");
    //     centerGlow.addColorStop(0.3, "rgba(180, 255, 200, 0.3)");
    //     centerGlow.addColorStop(1, "rgba(120, 220, 150, 0)");

    //     ctx.fillStyle = centerGlow;
    //     ctx.fillRect(0, 0, 1024, 1024);
    //   }

    //   return new THREE.CanvasTexture(canvas);
    // };

    // const glowTexture = createGlowTexture();
    // const glowGeometry = new THREE.PlaneGeometry(8, 8); // Smaller, focused glow
    // const glowMaterial = new THREE.MeshBasicMaterial({
    //   map: glowTexture,
    //   transparent: true,
    //   opacity: 0,
    //   toneMapped: false,
    //   depthWrite: false,
    //   blending: THREE.AdditiveBlending, // Makes it glow
    // });

    // const glowPlane = new THREE.Mesh(glowGeometry, glowMaterial);
    // glowPlaneRef.current = glowPlane;
    // glowPlane.position.set(0.1, 0.2, -0.3); // Position behind the leaf center
    // glowPlane.lookAt(camera.position);
    // scene.add(glowPlane);

    // Load Model 3D
    gltfLoader.load(
      "/models/Leaf-Animation.glb",
      (gltf: { scene: THREE.Object3D<THREE.Object3DEventMap> | null }) => {
        leafModelRef.current = gltf.scene;
        if (leafModelRef.current) {
          leafModelRef.current.visible = false;

          // VALUES FROM BLENDER (with Apply All Transforms)
          // Blender Leaf: Location (0, 0, 0), Rotation (0, 0, 0), Scale (1, 1, 1)
          const LEAF_POSITION = { x: 0.1, y: 0.2, z: 0 };
          const LEAF_ROTATION = { x: 0, y: 0, z: 0 };
          const LEAF_SCALE = { x: 1.2, y: 1.2, z: 1.2 };

          // Apply transform values
          leafModelRef.current.position.set(
            LEAF_POSITION.x,
            LEAF_POSITION.y,
            LEAF_POSITION.z,
          );

          // Apply rotation (convert from Blender if needed)
          leafModelRef.current.rotation.set(
            LEAF_ROTATION.x,
            LEAF_ROTATION.y,
            LEAF_ROTATION.z,
          );

          // Apply scale
          leafModelRef.current.scale.set(
            LEAF_SCALE.x,
            LEAF_SCALE.y,
            LEAF_SCALE.z,
          );

          // Configure materials to receive HDRI environment lighting
          leafModelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const materials = Array.isArray(child.material)
                ? child.material
                : [child.material];

              materials.forEach((mat) => {
                // Ensure material can receive HDRI environment lighting
                if (
                  mat instanceof THREE.MeshStandardMaterial ||
                  mat instanceof THREE.MeshPhysicalMaterial
                ) {
                  // Only set transparency for fade transition - keep all other properties from Blender
                  mat.transparent = true;
                  mat.opacity = 0; // Start invisible for fade-in effect
                  mat.toneMapped = false; // Disable tone mapping to match sequence PNG colors
                  mat.needsUpdate = true;
                }
              });
            }
          });

          scene.add(leafModelRef.current);

          // Calculate bounding box to get actual model size
          const box = new THREE.Box3().setFromObject(leafModelRef.current);
          const size = new THREE.Vector3();
          box.getSize(size);
          const center = new THREE.Vector3();
          box.getCenter(center);

          console.log("Leaf model dimensions:", {
            width: size.x,
            height: size.y,
            depth: size.z,
            center: center,
          });

          // Calculate the visual size from camera perspective
          // Get the distance from camera to object center
          const distance = camera.position.distanceTo(center);

          // Calculate the visible height using perspective projection
          // The formula: visibleHeight = 2 * distance * tan(fov/2)
          const vFOV = (CAMERA_FOV * Math.PI) / 180; // Convert to radians
          const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;

          // We want the plane to fill roughly the same visual space as the model
          // Use a scale factor based on the model's height relative to the visible area
          const heightRatio = 1.3 / visibleHeight;
          const planeVisualHeight = visibleHeight * heightRatio * 2.5; // Multiply by ~2-2.5 to match visual size
          const newPlaneWidth = planeVisualHeight * aspect;

          // Adjust plane size to match the model's visual projection
          if (sequencePlaneRef.current) {
            // Update plane geometry
            sequencePlaneRef.current.geometry.dispose();
            sequencePlaneRef.current.geometry = new THREE.PlaneGeometry(
              newPlaneWidth,
              planeVisualHeight,
            );

            console.log("Adjusted plane dimensions:", {
              width: newPlaneWidth,
              height: planeVisualHeight,
              distance: distance,
              heightRatio: heightRatio,
            });
          }
        }
      },
      // Progress callback
      undefined,
      // Error callback
      (error) => {
        console.error("Error loading leaf model:", error);
      },
    );

    // --- 4. ANIMATION LOOP ---
    const fps = 30;
    const frameInterval = 1000 / fps;

    const animate = (time: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // CHỈ CHẠY KHI ĐÃ LOAD XONG - Use ref to avoid re-render issues
      if (!isLoadedRef.current) {
        renderer.render(scene, camera);
        return;
      }

      // Logic chuyển frame
      if (time - lastTimeRef.current > frameInterval) {
        // Hiện plane ngay frame đầu tiên
        if (currentFrameRef.current === 0 && sequencePlaneRef.current) {
          sequencePlaneRef.current.material.opacity = 1;
          // Gán texture đầu tiên ngay lập tức để tránh chớp trắng
          if (texturesRef.current[0]) {
            sequencePlaneRef.current.material.map = texturesRef.current[0];
            sequencePlaneRef.current.material.needsUpdate = true;
          }
        }

        if (currentFrameRef.current < totalFrames - 1) {
          currentFrameRef.current++;

          if (
            texturesRef.current[currentFrameRef.current] &&
            sequencePlaneRef.current
          ) {
            sequencePlaneRef.current.material.map =
              texturesRef.current[currentFrameRef.current];
            // Quan trọng: Báo ThreeJS cập nhật texture mới
            sequencePlaneRef.current.material.needsUpdate = true;
          }
        } else if (!hasAnimatedRef.current) {
          // Start transition
          hasAnimatedRef.current = true;
          transitionStartTimeRef.current = time;
          isTransitioningRef.current = true;
          if (leafModelRef.current) leafModelRef.current.visible = true;
        }
        lastTimeRef.current = time;
      }

      // Handle smooth fade transition
      if (isTransitioningRef.current) {
        const transitionDuration = 1000; // 1 second fade
        const elapsed = time - transitionStartTimeRef.current;
        const progress = Math.min(elapsed / transitionDuration, 1);

        // Ease-in-out function for smoother transition
        const easeProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        // Fade out sequence plane
        if (sequencePlaneRef.current) {
          sequencePlaneRef.current.material.opacity = 1 - easeProgress;
        }

        // Fade in 3D model
        if (leafModelRef.current) {
          leafModelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => {
                  mat.opacity = easeProgress;
                });
              } else {
                child.material.opacity = easeProgress;
              }
            }
          });
        }

        // Fade in glow effect (delayed and slower for more natural appearance)
        // Glow starts appearing only after 40% of transition is complete
        const glowDelay = 0.4; // Start glow at 40% of transition
        const glowProgress = Math.max(
          0,
          (progress - glowDelay) / (1 - glowDelay),
        );

        // Apply smooth ease-in curve specifically for glow (cubic ease-in for gentle start)
        const glowEase = glowProgress * glowProgress * glowProgress;

        if (glowPlaneRef.current && !Array.isArray(glowPlaneRef.current.material)) {
          glowPlaneRef.current.material.opacity = glowEase * 0.6; // Max 60% opacity, more subtle
        }

        // Fade in glow light even more gradually
        if (glowLightRef.current) {
          glowLightRef.current.intensity = glowEase * 15; // Softer light intensity
        }

        // End transition
        if (progress >= 1) {
          isTransitioningRef.current = false;
          if (sequencePlaneRef.current) {
            sequencePlaneRef.current.visible = false;
          }
        }
      }

      // Floating animation + Mouse parallax + Scroll falling (only after leaf is visible)
      if (hasAnimatedRef.current && leafModelRef.current) {
        const scrollProgress = scrollProgressRef.current;

        // Base floating animation (gets weaker as leaf falls)
        const floatSpeed = 0.0008;
        const floatAmount = 0.05 * (1 - scrollProgress * 0.7); // Reduce floating as it falls
        const rotateSpeed = 0.0003;
        const rotateAmount = 0.08;

        const floatY = Math.sin(time * floatSpeed) * floatAmount;
        const rotateX = Math.sin(time * rotateSpeed) * rotateAmount;
        const rotateZ = Math.cos(time * rotateSpeed * 0.7) * rotateAmount;

        // Mouse parallax - smooth interpolation (reduced during falling)
        const parallaxStrength = 0.15 * (1 - scrollProgress * 0.5);
        const lerpFactor = 0.05;

        targetRotationRef.current.x +=
          (mousePositionRef.current.y * parallaxStrength -
            targetRotationRef.current.x) *
          lerpFactor;
        targetRotationRef.current.y +=
          (mousePositionRef.current.x * parallaxStrength -
            targetRotationRef.current.y) *
          lerpFactor;

        // Natural falling animation based on scroll
        const fallDistance = scrollProgress * 8; // Fall 8 units down
        const fallRotationX = scrollProgress * Math.PI * 2; // Tumble forward (2 full rotations)
        const fallRotationY = scrollProgress * Math.PI * 1.5; // Spin around Y axis
        const fallRotationZ = Math.sin(scrollProgress * Math.PI * 3) * 0.5; // Wobble side to side

        // Horizontal sway (leaves drift as they fall)
        const swayAmount = Math.sin(scrollProgress * Math.PI * 4) * 0.8; // Drift left/right

        // Scale down slightly as it falls (perspective)
        const fallScale = 1 - scrollProgress * 0.3; // Shrink to 70% size
        leafModelRef.current.scale.set(
          1.2 * fallScale,
          1.2 * fallScale,
          1.2 * fallScale,
        );

        // Apply combined transformations
        leafModelRef.current.position.y =
          initialLeafPositionRef.current.y + floatY - fallDistance;

        leafModelRef.current.position.x =
          initialLeafPositionRef.current.x +
          mousePositionRef.current.x * 0.1 +
          swayAmount;

        // Combine all rotations (floating, parallax, and falling)
        leafModelRef.current.rotation.x =
          rotateX + targetRotationRef.current.x + fallRotationX;
        leafModelRef.current.rotation.y = fallRotationY;
        leafModelRef.current.rotation.z =
          rotateZ + targetRotationRef.current.y + fallRotationZ;

        // Fade out glow as leaf falls
        if (glowPlaneRef.current && !Array.isArray(glowPlaneRef.current.material)) {
          glowPlaneRef.current.material.opacity = Math.max(
            0,
            0.6 * (1 - scrollProgress * 1.5),
          );
        }
        if (glowLightRef.current) {
          glowLightRef.current.intensity = Math.max(
            0,
            15 * (1 - scrollProgress * 1.5),
          );
        }
      }

      renderer.render(scene, camera);
    };

    animate(0);

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Dispose textures
      texturesRef.current.forEach((texture) => {
        if (texture) texture.dispose();
      });

      // Dispose geometry and material
      if (sequencePlaneRef.current) {
        sequencePlaneRef.current.geometry.dispose();
        sequencePlaneRef.current.material.dispose();
      }

      // Dispose glow plane
      const glowPlane = glowPlaneRef.current;
      if (glowPlane) {
        glowPlane.geometry.dispose();
        const material = glowPlane.material;
        if (!Array.isArray(material)) {
          if (
            "map" in material &&
            material.map &&
            typeof material.map === "object" &&
            "dispose" in material.map
          ) {
            (material.map as THREE.Texture).dispose();
          }
          material.dispose();
        }
      }

      // Dispose model
      if (leafModelRef.current) {
        leafModelRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            if (object.material instanceof THREE.Material) {
              object.material.dispose();
            } else if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            }
          }
        });
      }

      // Dispose renderer
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container && rendererRef.current.domElement) {
          container.removeChild(rendererRef.current.domElement);
        }
      }

      // Dispose scene environment
      if (sceneRef.current?.environment) {
        sceneRef.current.environment.dispose();
      }
    };
  }, []); // Empty dependency array to prevent re-running

  return (
    <div className="absolute w-5xl z-20 right-0 bg-transparent h-screen overflow-hidden">
      {/* LOADING SCREEN */}
      {!isLoaded && (
        <div className="absolute bg-transparent inset-0 flex items-center justify-center z-50"></div>
      )}

      {/* <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center overflow-hidden"
        initial={{ x: "0%" }}
        animate={{ x: "-50%" }}
        transition={{
          duration: 150,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
      >
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
        <span className="text-[240px] font-bold whitespace-nowrap px-8">
          WEAVECARBON
        </span>
      </motion.div> */}


      {/* CANVAS CONTAINER */}
      <div
        ref={containerRef}
        className="relative z-20 inset-0 w-full h-full bg-transparent"
      />
    </div>
  );
};

export default LeafHero3D;
