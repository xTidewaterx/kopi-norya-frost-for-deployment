// src/components/Deer.jsx
import { useGLTF, useAnimations } from '@react-three/drei';
import { useRef } from 'react';
import { useEffect } from 'react';
export default function Deer(props) {
  const ref = useRef();
  const { scene, animations } = useGLTF('/models/deer/scene.gltf');
  const { actions } = useAnimations(animations, ref);

  // Play first animation on mount
  useEffect(() => {
    if (actions && animations.length > 0) {
      actions[animations[0].name]?.play();
    }
  }, [actions, animations]);

  return <primitive ref={ref} object={scene} {...props} />;
}

useGLTF.preload('/models/deer/scene.gltf');