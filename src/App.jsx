import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei' // УБРАЛИ CENTER
import { Model as Iphone } from './iphone'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// --- RIG (Слежение за мышкой) ---
function Rig({ children }) {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x / 20, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y / 20, 0.05)
    }
  })
  return <group ref={group}>{children}</group>
}

// --- SMOOTH SCROLL ---
function SmoothScrollWrapper() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.5, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smooth: true })
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    return () => lenis.destroy()
  }, [])
  return null
}

// --- АНИМАЦИЯ ---
function AnimationController({ modelRef }) {
  useLayoutEffect(() => {
    if (!modelRef.current) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".sections-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1, 
      }
    })

    // --- СТАРТ (ЭКРАН 1) ---
    // scale: 150 (Твой идеальный размер)
    // y: -15 (ОПУСТИЛИ ВНИЗ). Теперь Center не мешает, и он реально опустится.
    // x: 0 (Центр)
    // rotation: Лежит камерами вверх
    gsap.set(modelRef.current.position, { x: 0, y: -7.5, z: 0 }) 
    gsap.set(modelRef.current.rotation, { x: -1, y: Math.PI, z: 0 }) 
    gsap.set(modelRef.current.scale, { x: 150, y: 150, z: 150 }) 

    // --- СЦЕНАРИЙ ---

    // 1. ПЕРЕХОД КО 2 ЭКРАНУ (Чип)
    // scale: 25 (Уменьшаем)
    // y: 0 (Поднимаем из -15 в центр). Если улетает слишком высоко — ставь тут y: -2 или -5.
    tl.to(modelRef.current.rotation, { x: 0, y: Math.PI / 2, duration: 2 }, 0) 
      .to(modelRef.current.scale, { x: 35, y: 35, z: 35, duration: 2 }, 0) 
      .to(modelRef.current.position, { x: 5, y: 0, z: 0, duration: 2 }, 0) // x: 5 (вправо)

    // 2. ПЕРЕХОД К 3 ЭКРАНУ (Камера)
    tl.to(modelRef.current.rotation, { x: 0, y: Math.PI, duration: 2 }, 2)
      .to(modelRef.current.position, { x: -5, y: 0, z: 0, duration: 2 }, 2)

    // 3. ФИНАЛ (Центр)
    tl.to(modelRef.current.rotation, { x: 0, y: 0, duration: 2 }, 4)
      .to(modelRef.current.position, { x: 0, y: 0, z: 0 }, 4)
      .to(modelRef.current.scale, { x: 35, y: 35, z: 35, duration: 2 }, 4)
    
    // ТЕКСТ
    tl.to(".hero-container", { opacity: 0, y: -50, duration: 1 }, 0)
    tl.fromTo(".section.left", { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 1 }, 0.5)
    tl.to(".section.left", { opacity: 0, duration: 1 }, 2)
    tl.fromTo(".section.right", { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 1 }, 2.5)

  }, [])
  return null
}

export default function App() {
  const modelRef = useRef()
  const [activeColor, setActiveColor] = useState('#ad7f63') 

  return (
    <>
      <SmoothScrollWrapper />
      <nav className="navbar">
        <div className="logo"> iPhone 17 Pro</div>
        <button className="btn-primary">Купить</button>
      </nav>

      <div className="canvas-container">
        {/* Камера */}
        <Canvas camera={{ position: [0, 0, 18], fov: 30 }} gl={{ antialias: false }} dpr={[1, 2]}>
          <color attach="background" args={['#000']} />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1000} color="#ffecd1" />
          <pointLight position={[-10, -10, -10]} intensity={500} color="#ffffff" />
          <Environment preset="studio" environmentIntensity={0.6} />

          {/* Внутри Canvas */}
          <color attach="background" args={['#000']} />

          {/* Уменьшаем общий свет, чтобы тени были глубже */}
          <ambientLight intensity={0.3} />

          {/* Основной прожектор (Key Light) - теплый оттенок */}
          <spotLight 
            position={[10, 15, 10]} 
            angle={0.3} 
            penumbra={1} 
            intensity={800} 
            color="#fff0dd" 
            castShadow 
          />

          {/* Контровой свет (Rim Light) - холодный, чтобы подчеркнуть грани металла */}
          <spotLight 
            position={[-10, 5, -10]} 
            angle={0.5} 
            penumbra={1} 
            intensity={1500} 
            color="#cceeff" 
          />

          {/* Отражения студии. Попробуй preset="city" или "warehouse" для металла, они контрастнее чем studio */}
          <Environment preset="warehouse" environmentIntensity={0.7} />

          {/* УБРАЛИ CENTER! Оставили только Float и Rig */}
          <Float floatIntensity={0.2} rotationIntensity={0.1} speed={2}>
            <Rig>
              <group ref={modelRef}>
                <Iphone itemColor={activeColor} />
              </group>
            </Rig>
          </Float>

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.4} radius={0.6} />
            <ToneMapping adaptive /> 
          </EffectComposer>
          <AnimationController modelRef={modelRef} />
        </Canvas>
      </div>

      <div className="color-picker">
        <div className="color-dot" style={{background: '#ad7f63'}} onClick={() => setActiveColor('#ad7f63')}></div>
        <div className="color-dot" style={{background: '#3b3b3b'}} onClick={() => setActiveColor('#3b3b3b')}></div>
        <div className="color-dot" style={{background: '#f2f1ed'}} onClick={() => setActiveColor('#f2f1ed')}></div>
        <div className="color-dot" style={{background: '#38465e'}} onClick={() => setActiveColor('#38465e')}></div>
      </div>

      <div className="sections-container">
        <section className="section top-center hero-container">
          <h1 className="apple-header">iPhone 17 <span className="pro-text">PRO</span></h1>
          <div className="hero-prices">
            <button className="btn-buy-large">Купить</button>
            <p>От 1329 евро</p>
          </div>
        </section>

        <section className="section left">
          <h2>A19 Pro.</h2>
          <p>Чип, меняющий правила игры.</p>
        </section>
        <section className="section right">
          <h2>Камера.</h2>
          <p>48 МП Fusion.<br/>Поймай момент.</p>
        </section>
        <section className="section center">
          <h2>iPhone 17 Pro</h2>
          <p>Будущее уже здесь.</p>
        </section>
      </div>
    </>
  )
}