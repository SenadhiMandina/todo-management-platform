import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoForm from '../components/TodoForm';

describe('TodoForm validation', () => {
  it('shows a validation error and does not submit when the title is empty', async () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<TodoForm open initial={null} onClose={onClose} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create Todo' }));

    await waitFor(() => expect(screen.getByText('Title is required')).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when the title is shorter than 3 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<TodoForm open initial={null} onClose={() => {}} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('e.g. Finish project report'), 'ab');
    fireEvent.click(screen.getByRole('button', { name: 'Create Todo' }));

    await waitFor(() =>
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument()
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed title/description when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<TodoForm open initial={null} onClose={onClose} onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('e.g. Finish project report'), '  Buy groceries  ');
    fireEvent.click(screen.getByRole('button', { name: 'Create Todo' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ title: 'Buy groceries', description: '' }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });
});
