import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders smurf detector title', () => {
  render(<App />);
  const titleElement = screen.getByText(/League of Legends Smurf Detector/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders analyze button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /Analyze Player/i });
  expect(buttonElement).toBeInTheDocument();
});

test('renders player input field', () => {
  render(<App />);
  const inputElement = screen.getByPlaceholderText(/Enter player name/i);
  expect(inputElement).toBeInTheDocument();
});
