import { render, screen, fireEvent } from '@testing-library/react';
import IssueForm from './IssueForm';

describe('IssueForm — photo input', () => {
  it('renders Take Photo and Choose from Gallery buttons', () => {
    render(<IssueForm />);
    expect(screen.getByRole('button', { name: /take a photo with your camera/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /choose a photo from your gallery/i })).toBeInTheDocument();
  });

  it('camera input has capture="environment"', () => {
    render(<IssueForm />);
    const cameraInput = screen.getByTestId('camera-input');
    expect(cameraInput).toHaveAttribute('capture', 'environment');
    expect(cameraInput).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('gallery input has no capture attribute', () => {
    render(<IssueForm />);
    const galleryInput = screen.getByTestId('gallery-input');
    expect(galleryInput).not.toHaveAttribute('capture');
    expect(galleryInput).toHaveAttribute('accept', 'image/jpeg,image/png');
  });

  it('shows preview and removes choice buttons when a valid photo is selected', () => {
    render(<IssueForm />);
    const galleryInput = screen.getByTestId('gallery-input');
    const file = new File(['pixel'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(galleryInput, { target: { files: [file] } });

    expect(screen.getByAltText('Preview of selected photo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /take a photo/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /remove photo/i })).toBeInTheDocument();
  });

  it('shows an error and keeps choice buttons for an invalid file type', () => {
    render(<IssueForm />);
    const galleryInput = screen.getByTestId('gallery-input');
    const file = new File(['gif'], 'anim.gif', { type: 'image/gif' });
    fireEvent.change(galleryInput, { target: { files: [file] } });

    expect(screen.getByRole('alert')).toHaveTextContent(/only jpeg and png/i);
    expect(screen.getByRole('button', { name: /take a photo with your camera/i })).toBeInTheDocument();
  });

  it('shows an error for files exceeding 5 MB', () => {
    render(<IssueForm />);
    const galleryInput = screen.getByTestId('gallery-input');
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
    fireEvent.change(galleryInput, { target: { files: [bigFile] } });

    expect(screen.getByRole('alert')).toHaveTextContent(/5 mb/i);
  });

  it('restores choice buttons after removing a photo', () => {
    render(<IssueForm />);
    const galleryInput = screen.getByTestId('gallery-input');
    const file = new File(['pixel'], 'photo.png', { type: 'image/png' });
    fireEvent.change(galleryInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /remove photo/i }));

    expect(screen.getByRole('button', { name: /take a photo with your camera/i })).toBeInTheDocument();
    expect(screen.queryByAltText('Preview of selected photo')).not.toBeInTheDocument();
  });
});
