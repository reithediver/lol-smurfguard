import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders smurf detector title', () => {
  render(<App />);
  const titleElement = screen.getByText(/LoL SmurfGuard/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders enhanced dashboard button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /Enhanced Dashboard/i });
  expect(buttonElement).toBeInTheDocument();
});

test('renders demo button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /Demo/i });
  expect(buttonElement).toBeInTheDocument();
});

test('renders analysis button', () => {
  render(<App />);
  const buttonElement = screen.getByRole('button', { name: /Analysis/i });
  expect(buttonElement).toBeInTheDocument();
});
