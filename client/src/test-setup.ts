import '@testing-library/jest-dom';

// jsdom does not implement URL.createObjectURL — provide a stub
if (typeof URL.createObjectURL === 'undefined') {
  URL.createObjectURL = () => 'blob:mock';
}
