import { Theme } from '../types/config';

const theme: Theme = {
  colors: {
    primary: '#2196f3',
    background: '#ffffff',
    text: '#333333',
    error: '#f44336',
    success: '#4caf50'
  },
  typography: {
    fontFamily: '"Noto Sans JP", sans-serif',
    fontSize: {
      small: '0.875rem',
      medium: '1rem',
      large: '1.25rem'
    }
  },
  chatWidget: {
    buttonSize: '60px',
    borderRadius: '50%',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
  }
};

export function getTheme(): Theme {
  return theme;
} 