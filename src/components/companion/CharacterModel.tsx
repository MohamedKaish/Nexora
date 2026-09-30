'use client'

import { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCompanionStore } from '@/store/companionStore'
import * as THREE from 'three'

export function CharacterModel() {
  const groupRef = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Mesh>(null)
  
  const { skin, outfit, accessory, glasses, mood } = useCompanionStore()
  
  // Animation state
  const [hovered, setHovered] = useState(false)
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Idle bobbing
    const time = state.clock.getElapsedTime()
    
    if (mood === 'idle') {
      groupRef.current.position.y = Math.sin(time * 2) * 0.1
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(time * 0.5) * 0.2
        headRef.current.rotation.z = Math.sin(time * 1.5) * 0.05
      }
    } else if (mood === 'happy' || mood === 'celebrating') {
      // Bouncing
      groupRef.current.position.y = Math.abs(Math.sin(time * 8)) * 0.5
      if (headRef.current) {
        headRef.current.rotation.y = 0
        headRef.current.rotation.z = 0
      }
    } else if (mood === 'focused' || mood === 'working') {
      // Still, looking down slightly
      groupRef.current.position.y = 0
      if (headRef.current) {
        headRef.current.rotation.x = Math.PI * 0.05
        headRef.current.rotation.y = Math.sin(time) * 0.1
      }
    } else if (mood === 'thinking') {
      groupRef.current.position.y = Math.sin(time) * 0.05
      if (headRef.current) {
        headRef.current.rotation.y = Math.PI * 0.15
        headRef.current.rotation.x = -Math.PI * 0.05
      }
    }
    
    // Pointer interaction
    if (hovered && mood === 'idle') {
      // Look at mouse
      const x = (state.pointer.x * Math.PI) / 4
      const y = (state.pointer.y * Math.PI) / 4
      if (headRef.current) {
        headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, x, 0.1)
        headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -y, 0.1)
      }
    }
  })

  // Procedural colors based on wardrobe
  const skinColor = skin === 'base_maid' ? '#ffe0bd' : skin === 'base_tech' ? '#f1c27d' : '#e0ac69'
  const outfitColor = outfit.includes('maid') ? '#1a1a1a' : outfit.includes('armor') ? '#9ca3af' : '#3b82f6'
  const outfitSecondary = outfit.includes('maid') ? '#ffffff' : outfit.includes('armor') ? '#4b5563' : '#1d4ed8'

  return (
    <group 
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      dispose={null}
    >
      {/* Body / Outfit */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.8, 2, 16]} />
        <meshStandardMaterial color={outfitColor} roughness={0.7} />
      </mesh>
      
      {/* Dress accents */}
      {outfit === 'maid_uniform' && (
        <mesh position={[0, 1.2, 0]} castShadow>
          <cylinderGeometry args={[0.9, 1.2, 0.8, 16]} />
          <meshStandardMaterial color={outfitSecondary} roughness={0.9} />
        </mesh>
      )}

      {/* Head Group */}
      <group ref={headRef} position={[0, 2.8, 0]}>
        {/* Head */}
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshStandardMaterial color={skinColor} roughness={0.5} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.25, 0.1, 0.65]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.25, 0.1, 0.65]}>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#111111" />
        </mesh>

        {/* Glasses */}
        {glasses === 'tech_visor' && (
          <mesh position={[0, 0.1, 0.7]}>
            <boxGeometry args={[0.8, 0.2, 0.1]} />
            <meshStandardMaterial color="#06b6d4" transparent opacity={0.7} emissive="#06b6d4" emissiveIntensity={0.5} />
          </mesh>
        )}
        
        {glasses === 'round_glasses' && (
          <group position={[0, 0.1, 0.7]}>
            <mesh position={[-0.25, 0, 0]}>
              <torusGeometry args={[0.15, 0.02, 16, 32]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0.25, 0, 0]}>
              <torusGeometry args={[0.15, 0.02, 16, 32]} />
              <meshStandardMaterial color="#222" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.2, 0.02, 0.02]} />
              <meshStandardMaterial color="#222" />
            </mesh>
          </group>
        )}

        {/* Hair / Accessory */}
        <mesh position={[0, 0.6, -0.1]}>
          <sphereGeometry args={[0.72, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3b2e2a" />
        </mesh>

        {/* Maid Headband */}
        {accessory === 'maid_headband' && (
          <mesh position={[0, 0.7, 0.3]} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[0.7, 0.08, 16, 32, Math.PI]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        )}
        
        {/* Tech Headset */}
        {accessory === 'tech_headset' && (
          <mesh position={[-0.8, 0, 0]}>
            <boxGeometry args={[0.2, 0.6, 0.4]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        )}
      </group>

      {/* Arms */}
      <mesh position={[-0.8, 1.8, 0]} rotation={[0, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.15, 1, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
      <mesh position={[0.8, 1.8, 0]} rotation={[0, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.15, 1, 8, 8]} />
        <meshStandardMaterial color={skinColor} />
      </mesh>
    </group>
  )
}
