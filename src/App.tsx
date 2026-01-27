import './index.css';
import { SwaggerForm } from './components/SwaggerForm';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Suppress swagger-ui-react known deprecation warning
    // _ModelCollapse uses UNSAFE_componentWillReceiveProps which is a known issue
    // in swagger-ui-react. This warning doesn't affect functionality.
    const originalError = console.error;
    console.error = (...args) => {
      if (
        args[0]?.includes?.('UNSAFE_componentWillReceiveProps') &&
        args[0]?.includes?.('_ModelCollapse')
      ) {
        return;
      }
      originalError(...args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return <SwaggerForm />;
}

export default App;
