'use client';

/**
 * Global Error Boundary
 * 
 * This component catches errors that occur in the root layout.
 * IMPORTANT: This must be a self-contained component without any context dependencies
 * because it renders when the root layout (and its providers) fail.
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en" className="dark">
            <body
                style={{
                    backgroundColor: '#000',
                    color: '#fff',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: 0,
                    padding: '20px',
                }}
            >
                <div
                    style={{
                        maxWidth: '500px',
                        textAlign: 'center',
                        padding: '40px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '24px',
                            fontWeight: 600,
                            marginBottom: '16px',
                            color: '#fff',
                        }}
                    >
                        Something went wrong
                    </h1>
                    <p
                        style={{
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.7)',
                            marginBottom: '24px',
                            lineHeight: 1.6,
                        }}
                    >
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    {error?.digest && (
                        <p
                            style={{
                                fontSize: '12px',
                                color: 'rgba(255, 255, 255, 0.5)',
                                marginBottom: '24px',
                                fontFamily: 'monospace',
                            }}
                        >
                            Error ID: {error.digest}
                        </p>
                    )}
                    <button
                        onClick={() => reset()}
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            color: '#fff',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '12px 24px',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        Try again
                    </button>
                </div>
            </body>
        </html>
    );
}
