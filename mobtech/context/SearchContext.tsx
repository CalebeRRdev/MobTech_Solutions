// context/SearchContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface SearchState {
  query: string;
  destination?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  origin?: {
    latitude: number;
    longitude: number;
  };
}

interface SearchContextType {
  search: SearchState;
  setSearch: (data: Partial<SearchState>) => void;
  reset: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [search, setSearchState] = useState<SearchState>({ query: '' });

  const setSearch = (data: Partial<SearchState>) => {
    setSearchState(prev => ({ ...prev, ...data }));
  };

  const reset = () => setSearchState({ query: '' });

  return (
    <SearchContext.Provider value={{ search, setSearch, reset }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('useSearch must be used within SearchProvider');
  return context;
};




// // context/SearchContext.tsx
// import { createContext, useContext, useState, ReactNode } from 'react';

// interface SearchState {
//   query: string;
//   from?: string;
//   to?: string;
// }

// interface SearchContextType {
//   search: SearchState;
//   setSearch: (data: Partial<SearchState>) => void;
//   reset: () => void;
// }

// const SearchContext = createContext<SearchContextType | undefined>(undefined);

// export function SearchProvider({ children }: { children: ReactNode }) {
//   const [search, setSearchState] = useState<SearchState>({ query: '' });

//   const setSearch = (data: Partial<SearchState>) => {
//     setSearchState(prev => ({ ...prev, ...data }));
//   };

//   const reset = () => setSearchState({ query: '' });

//   return (
//     <SearchContext.Provider value={{ search, setSearch, reset }}>
//       {children}
//     </SearchContext.Provider>
//   );
// }

// export const useSearch = () => {
//   const context = useContext(SearchContext);
//   if (!context) throw new Error('useSearch must be used within SearchProvider');
//   return context;
// };