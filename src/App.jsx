import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { Model as Iphone } from './iphone'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import * as THREE from 'three'

gsap.registerPlugin(ScrollTrigger)

// --- ЗВУК (Файл sound.mp3 должен быть в папке public) ---
const playSound = () => {
  const audio = new Audio('/sound.mp3') 
  audio.volume = 0.5
  audio.play().catch(e => console.log('Audio error:', e))
}

// --- RIG (Покачивание за мышкой) ---
function Rig({ children, isMobile }) {
  const group = useRef()
  useFrame((state) => {
    if (group.current) {
      // На мобилках амплитуда меньше
      const intensity = isMobile ? 50 : 20
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.pointer.x / intensity, 0.05)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -state.pointer.y / intensity, 0.05)
    }
  })
  return <group ref={group}>{children}</group>
}

// --- ПЛАВНЫЙ СКРОЛЛ ---
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
function AnimationController({ modelRef, isMobile }) {
  useLayoutEffect(() => {
    if (!modelRef.current) return

    // Чистим старые триггеры при ресайзе
    ScrollTrigger.getAll().forEach(t => t.kill());

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".sections-container",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // Плавность
      }
    })

    // ==========================================
    // 1. НАСТРОЙКИ ТЕЛЕФОНА
    // ==========================================

    // СТАРТ: Лежит на спине (камерами вверх), чуть наклонен
    gsap.set(modelRef.current.rotation, { x: -0.85, y: Math.PI, z: 0 }) 
    
    // СТАРТ: Позиция и Размер (зависят от устройства)
    gsap.set(modelRef.current.position, { 
      x: 0, 
      y: isMobile ? -5.0 : -8, // На мобилке выше (-5), на компе ниже (-7.5)
      z: 0 
    })
    
    gsap.set(modelRef.current.scale, { 
      x: isMobile ? 70 : 150,    // Размер: Моб 65, Комп 150
      y: isMobile ? 70 : 150, 
      z: isMobile ? 70 : 150 
    })

    // ШАГ 1: ЧИП (Встает, уменьшается, едет вправо/центр)
    tl.to(modelRef.current.rotation, { x: 0, y: Math.PI * 1.5, duration: 2 }, 0)
      .to(modelRef.current.scale, { 
        x: isMobile ? 30 : 35,   // Уменьшаем (Моб 15, Комп 30)
        y: isMobile ? 30 : 35, 
        z: isMobile ? 30 : 35, 
        duration: 2 
      }, 0)
      .to(modelRef.current.position, { 
        x: isMobile ? 0 : 5,     // Моб: ЦЕНТР (0), Комп: ВПРАВО (5)
        y: isMobile ? 1.5 : 0,   // Моб: Чуть вверх, Комп: Центр
        z: 0, 
        duration: 2 
      }, 0)

    // ШАГ 2: КАМЕРА (Поворот спиной)
    tl.to(modelRef.current.rotation, { x: 0, y: Math.PI, duration: 2 }, 2)
      .to(modelRef.current.position, { 
        x: isMobile ? 0 : -5,    // Моб: ЦЕНТР (0), Комп: ВЛЕВО (-5)
        y: isMobile ? 1.5 : 0, 
        z: 0, 
        duration: 2 
      }, 2)

    // ШАГ 3: ФИНАЛ (Лицом)
    tl.to(modelRef.current.rotation, { x: 0, y: 0, duration: 2 }, 4)
      .to(modelRef.current.position, { x: 0, y: 0, z: 0 }, 4)
      .to(modelRef.current.scale, { 
        x: isMobile ? 30 : 35, 
        y: isMobile ? 30 : 35, 
        z: isMobile ? 30 : 35, 
        duration: 2 
      }, 4)

    // ==========================================
    // 2. АНИМАЦИЯ ТЕКСТА (ПРОСТОЙ FADE)
    // ==========================================
    
    // Убираем Hero
    tl.to(".hero-container", { opacity: 0, duration: 0.5 }, 0)
    
    // Показываем "Чип"
    tl.to(".section.left", { opacity: 1, duration: 1 }, 0.5)
    // Убираем "Чип"
    tl.to(".section.left", { opacity: 0, duration: 0.5 }, 2)
    
    // Показываем "Камеру"
    tl.to(".section.right", { opacity: 1, duration: 1 }, 2.5)
    // Убираем "Камеру"
    tl.to(".section.right", { opacity: 0, duration: 0.5 }, 4)

    // Показываем Финал
    tl.to(".section.center", { opacity: 1, duration: 1 }, 4.5)

  }, [isMobile]) // Перезапуск при смене типа устройства
  return null
}

export default function App() {
  const modelRef = useRef()
  const [activeColor, setActiveColor] = useState('#ad7f63') 
  
  // ЖЕЛЕЗОБЕТОННЫЙ ДЕТЕКТОР МОБИЛКИ
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 800)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleColorChange = (color) => {
    setActiveColor(color)
    playSound()
  }

  return (
    <>
      <SmoothScrollWrapper />
      <nav className="navbar">
        <div className="logo"> iPhone 17 Pro</div>
        <button className="btn-primary" onMouseEnter={playSound}>Купить</button>
      </nav>

      <div className="canvas-container">
        {/* Камера адаптируется (ближе/дальше) */}
        <Canvas camera={{ position: [0, 0, isMobile ? 22 : 18], fov: 30 }} gl={{ antialias: false }} dpr={[1, 2]}>
          <color attach="background" args={['#000']} />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1000} color="#ffecd1" />
          <pointLight position={[-10, -10, -10]} intensity={500} color="#ffffff" />
          <Environment preset="studio" environmentIntensity={0.6} />

          <Float floatIntensity={0.2} rotationIntensity={0.1} speed={2}>
            {/* Передаем isMobile в Rig для настройки чувствительности */}
            <Rig isMobile={isMobile}>
              <group ref={modelRef}>
                <Iphone itemColor={activeColor} />
              </group>
            </Rig>
          </Float>

          <EffectComposer disableNormalPass>
            <Bloom luminanceThreshold={1.5} mipmapBlur intensity={0.4} radius={0.6} />
            <ToneMapping adaptive /> 
          </EffectComposer>
          
          <AnimationController modelRef={modelRef} isMobile={isMobile} />
        </Canvas>
      </div>

      <div className="color-picker">
        <div className="color-dot" style={{background: '#ad7f63'}} onClick={() => handleColorChange('#ad7f63')}></div>
        <div className="color-dot" style={{background: '#3b3b3b'}} onClick={() => handleColorChange('#3b3b3b')}></div>
        <div className="color-dot" style={{background: '#f2f1ed'}} onClick={() => handleColorChange('#f2f1ed')}></div>
        <div className="color-dot" style={{background: '#38465e'}} onClick={() => handleColorChange('#38465e')}></div>
      </div>

      <div className="sections-container">
        <section className="section top-center hero-container">
          <h1 className="apple-header">iPhone 17 <span className="pro-text">PRO</span></h1>
          <div className="hero-prices">
            <button className="btn-buy-large" onMouseEnter={playSound}>Купить</button>
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