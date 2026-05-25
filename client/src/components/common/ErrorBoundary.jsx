import { Component } from 'react';

class ErrorBoundary extends Component {

  constructor(props){
    super(props);
    this.state = {
      hasError:false,
      message:''
    };
  }

  static getDerivedStateFromError(error){
    return {
      hasError:true,
      message: String(error?.message || error || 'Unknown error')
    };
  }

  componentDidCatch(error){
    // keep default behavior but log for debugging
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error);
  }

  render(){
    if(this.state.hasError){
      return (
        <div style={{
          minHeight:'100vh',
          background:'#050505',
          color:'#fff',
          padding:'24px',
          fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Arial'
        }}>
          <h2 style={{ margin:'0 0 10px' }}>Something went wrong</h2>
          <div style={{ color:'#94a3b8', fontWeight:650 }}>
            {this.state.message}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop:16,
              background:'#ff4d24',
              border:'none',
              color:'#fff',
              padding:'10px 14px',
              borderRadius:10,
              fontWeight:800,
              cursor:'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

