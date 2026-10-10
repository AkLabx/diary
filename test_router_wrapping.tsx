import React from 'react';
import { useHardwareBackButton } from './src/hooks/useHardwareBackButton';

const GlobalBackButtonHandler = () => {
  useHardwareBackButton();
  return null;
}
