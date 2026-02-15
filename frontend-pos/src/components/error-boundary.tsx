import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button, Result } from "antd";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Result
            status="error"
            title="Something went wrong"
            subTitle={this.state.error?.message || "An unexpected error occurred"}
            extra={[
              <Button type="primary" key="reload" onClick={() => window.location.reload()}>
                Reload Page
              </Button>,
              <Button key="retry" onClick={this.handleReset}>
                Try Again
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
