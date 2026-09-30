'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import { CharacterModel } from '../companion/CharacterModel'
import { Suspense } from 'react'

export function CompanionCanvas() {
  return (
    <div className="w-full h-full relative" style={{ minHeight: '300px' }}>
      <Canvas
        camera={{ position: [0, 2.5, 6], fov: 45 }}
        shadows
        gl={{ preserveDrawingBuffer: true, alpha: true }}
      >
        <color attach="background" args={['transparent']} />
        
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={1024}
        />
        <directionalLight position={[-5, 5, -5]} intensity={0.5} />
        <pointLight position={[0, 3, 2]} intensity={0.8} />

        {/* Character */}
        <Suspense fallback={null}>
          <CharacterModel />
          <Environment preset="city" />
        </Suspense>

        {/* Shadows and Ground */}
        <ContactShadows 
          position={[0, 0, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2} 
          far={4} 
        />
        
        <OrbitControls 
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  )
}
