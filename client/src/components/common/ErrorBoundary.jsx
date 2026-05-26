import { Component } from 'react';

class ErrorBoundary extends Component {

  constructor(props){
    super(props);
    this.state = {
      hasError:false,
      message:'',
      stack:'',
      componentStack:''
    };
  }

  static getDerivedStateFromError(error){
    return {
      hasError:true,
      message: String(error?.message || error || 'Unknown error'),
      stack: String(error?.stack || ''),
      componentStack:''
    };
  }

  componentDidCatch(error, info){
    // keep default behavior but log for debugging
    // eslint-disable-next-line no-console
    console.error('UI crashed:', error);
    try{
      this.setState({
        stack: String(error?.stack || this.state.stack || ''),
        componentStack: String(info?.componentStack || '')
      });
    } catch {}
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
          {import.meta?.env?.DEV && (this.state.stack || this.state.componentStack) && (
            <pre style={{
              marginTop:12,
              background:'#0b1220',
              border:'1px solid #1f2a44',
              padding:12,
              borderRadius:10,
              overflow:'auto',
              color:'#cbd5e1',
              fontSize:12,
              lineHeight:1.4
            }}>
              {this.state.stack || ''}
              {this.state.componentStack ? `\n\nComponent stack:${this.state.componentStack}` : ''}
            </pre>
          )}
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
