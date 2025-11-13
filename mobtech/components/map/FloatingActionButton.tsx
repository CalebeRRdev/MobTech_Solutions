// components/map/FloatingActionButton.tsx
import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

interface FloatingActionButtonProps {
  onPress: () => void;
  iconName?: keyof typeof Ionicons.glyphMap; // ← ADICIONE
  style?: object;
}

export default function FloatingActionButton({ 
  onPress, 
  iconName = 'add', 
  style 
}: FloatingActionButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Ionicons name={iconName} size={28} color={COLORS.white} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 20,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});




// // components/map/FloatingActionButton.tsx
// import React from 'react';
// import { TouchableOpacity, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { COLORS } from '../../constants/colors';

// interface FloatingActionButtonProps {
//   onPress: () => void;
// }

// export default function FloatingActionButton({ onPress }: FloatingActionButtonProps) {
//   return (
//     <TouchableOpacity style={styles.button} onPress={onPress}>
//       <Ionicons name="add" size={28} color={COLORS.white} />
//     </TouchableOpacity>
//   );
// }

// const styles = StyleSheet.create({
//   button: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     backgroundColor: COLORS.primary,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     justifyContent: 'center',
//     alignItems: 'center',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//   },
// });