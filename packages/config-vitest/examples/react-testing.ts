/**
 * React Testing Configuration Example
 *
 * Demonstrates Vitest setup specifically optimized for React component testing
 * with React Testing Library, JSDOM environment, and React-specific utilities.
 */

import { createReactConfig } from "../src/index.js";
import path from "path";

/**
 * React-optimized Vitest configuration
 * Includes JSDOM environment, React Testing Library setup, and JSX support
 */
export default createReactConfig({
  // Resolve path aliases for React projects
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/components": path.resolve(__dirname, "./src/components"),
      "@/hooks": path.resolve(__dirname, "./src/hooks"),
      "@/utils": path.resolve(__dirname, "./src/utils"),
      "@/pages": path.resolve(__dirname, "./src/pages"),
      "@/assets": path.resolve(__dirname, "./src/assets"),
    },
  },

  test: {
    // JSDOM environment for React testing
    environment: "jsdom",

    // Global test APIs
    globals: true,

    // Setup files for React testing
    setupFiles: ["./vitest.setup.ts", "./tests/react-setup.ts"],

    // React-specific test patterns
    include: [
      "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
      "tests/**/*.{js,ts,jsx,tsx}",
    ],

    // Exclude non-test files
    exclude: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "src/**/*.stories.{js,ts,jsx,tsx}",
      "src/**/*.d.ts",
    ],

    // Test timeout for async components
    testTimeout: 10000,

    // Coverage configuration for React
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],

      // React-specific coverage settings
      include: ["src/**/*.{js,ts,jsx,tsx}"],
      exclude: [
        "src/**/*.stories.{js,ts,jsx,tsx}",
        "src/**/*.d.ts",
        "src/main.tsx",
        "src/App.tsx",
        "src/vite-env.d.ts",
      ],

      thresholds: {
        global: {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
    },

    // Mock configuration
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
});

/**
 * React Testing Library setup file example
 */
export const reactSetupExample = `
// tests/react-setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  disconnect: vi.fn(),
  observe: vi.fn(),
  unobserve: vi.fn(),
})) as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock scrollTo
global.scrollTo = vi.fn();

// Mock getComputedStyle
global.getComputedStyle = vi.fn(() => ({
  getPropertyValue: vi.fn(),
})) as any;
`;

/**
 * Component testing example
 */
export const componentTestExample = `
// Button.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  const user = userEvent.setup();

  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('shows loading state', () => {
    render(<Button loading>Click me</Button>);
    
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('applies correct variant classes', () => {
    render(<Button variant="secondary">Click me</Button>);
    
    expect(screen.getByRole('button')).toHaveClass('btn--secondary');
  });

  it('handles async operations', async () => {
    const asyncHandler = vi.fn().mockResolvedValue('success');
    render(<Button onClick={asyncHandler}>Async Button</Button>);
    
    await user.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(asyncHandler).toHaveBeenCalled();
    });
  });
});
`;

/**
 * Hook testing example
 */
export const hookTestExample = `
// useToggle.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useToggle } from './useToggle';

describe('useToggle', () => {
  it('initializes with default value', () => {
    const { result } = renderHook(() => useToggle());
    
    expect(result.current[0]).toBe(false);
  });

  it('initializes with provided value', () => {
    const { result } = renderHook(() => useToggle(true));
    
    expect(result.current[0]).toBe(true);
  });

  it('toggles the value', () => {
    const { result } = renderHook(() => useToggle());
    
    act(() => {
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(true);
    
    act(() => {
      result.current[1]();
    });
    
    expect(result.current[0]).toBe(false);
  });
});
`;

/**
 * Context provider testing example
 */
export const contextTestExample = `
// AuthProvider.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthProvider';

// Test component that uses the context
function TestComponent() {
  const { user, login, logout, loading } = useAuth();
  
  return (
    <div>
      {loading && <div>Loading...</div>}
      {user ? (
        <div>
          <span>Welcome, {user.name}</span>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login('test@example.com', 'password')}>
          Login
        </button>
      )}
    </div>
  );
}

describe('AuthProvider', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    // Mock API calls
    global.fetch = vi.fn();
  });

  it('provides authentication context', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser)
    } as Response);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially shows login button
    expect(screen.getByText('Login')).toBeInTheDocument();

    // Click login
    await user.click(screen.getByText('Login'));

    // Wait for user to be loaded
    await waitFor(() => {
      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();
    });
  });

  it('handles logout', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    
    render(
      <AuthProvider initialUser={mockUser}>
        <TestComponent />
      </AuthProvider>
    );

    // User is logged in
    expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument();

    // Click logout
    await user.click(screen.getByText('Logout'));

    // Back to login state
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
`;

/**
 * Form testing example
 */
export const formTestExample = `
// ContactForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ContactForm } from './ContactForm';

describe('ContactForm', () => {
  const user = userEvent.setup();

  it('submits form with valid data', async () => {
    const onSubmit = vi.fn();
    render(<ContactForm onSubmit={onSubmit} />);

    // Fill out form
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');

    // Submit form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello world'
      });
    });
  });

  it('shows validation errors for invalid email', async () => {
    render(<ContactForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while submitting', async () => {
    const onSubmit = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<ContactForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/message/i), 'Hello world');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });
  });
});
`;

/**
 * Package.json scripts for React testing
 */
export const reactPackageScripts = {
  scripts: {
    // React-specific test commands
    test: "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",

    // Component-specific testing
    "test:components": "vitest src/components/**/*.test.tsx",
    "test:hooks": "vitest src/hooks/**/*.test.ts",
    "test:pages": "vitest src/pages/**/*.test.tsx",

    // Integration with Storybook
    "test:storybook": "test-storybook",

    // Visual regression testing
    "test:visual": "playwright test",

    // Accessibility testing
    "test:a11y": "vitest --config vitest.a11y.config.ts",
  },
};

/**
 * Accessibility testing configuration
 */
export const a11yTestConfig = createReactConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/a11y-setup.ts"],
    include: ["src/**/*.a11y.test.tsx"],
  },
});

/**
 * A11y test setup example
 */
export const a11ySetupExample = `
// tests/a11y-setup.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

// Configure Testing Library
configure({ testIdAttribute: 'data-testid' });

// Add jest-axe matchers
expect.extend(toHaveNoViolations);
`;
