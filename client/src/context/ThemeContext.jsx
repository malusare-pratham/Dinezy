import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const STORAGE_KEY = 'dinezy_theme_mode';

const ThemeContext = createContext(null);

const getAutoTheme = (date = new Date()) => {
  const hour = date.getHours();
  return hour >= 19 || hour < 7 ? 'dark' : 'light';
};

const normalizeMode = (value) => (
  ['auto','light','dark'].includes(value) ? value : 'auto'
);

export const ThemeProvider = ({
  children
}) => {
  const [mode,setMode] = useState(() => {
    try{
      return normalizeMode(localStorage.getItem(STORAGE_KEY));
    }
    catch{
      return 'auto';
    }
  });

  const [autoTheme,setAutoTheme] = useState(() => getAutoTheme());

  useEffect(() => {
    const id = setInterval(() => {
      setAutoTheme(getAutoTheme());
    },60000);

    return () => clearInterval(id);
  },[]);

  useEffect(() => {
    try{
      localStorage.setItem(STORAGE_KEY,mode);
    }
    catch{
      // ignore
    }
  },[mode]);

  const theme =
    mode === 'auto'
      ? autoTheme
      : mode;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme',theme);
    document.documentElement.setAttribute('data-theme-mode',mode);
  },[theme,mode]);

  const value = useMemo(() => ({
    mode,
    theme,
    setMode
  }),[mode,theme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if(!context){
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
};

