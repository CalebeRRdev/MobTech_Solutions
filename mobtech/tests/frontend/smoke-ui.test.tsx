// tests/frontend/smoke-ui.test.tsx
import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';

function DummyScreen() {
  return <Text>MobTech</Text>;
}

describe('Frontend - Smoke test de interface', () => {
  it('deve renderizar um componente React Native sem falhar', () => {
    const { getByText } = render(<DummyScreen />);

    expect(getByText('MobTech')).toBeTruthy();
  });
});