import React, { Component } from 'react';
import { useTranslation } from 'react-i18next';

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    const { t } = this.props; // Access translation function from props
    if (this.state.hasError) {
      return <p>{t('error_loading_games')}</p>;
    }
    return this.props.children;
  }
}

// Wrap with useTranslation HOC to enable i18n
export default function ErrorBoundaryWithTranslation(props) {
  const { t } = useTranslation();
  return <ErrorBoundary t={t} {...props} />;
}