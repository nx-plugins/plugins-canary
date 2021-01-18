import React, { createContext, useEffect, useState } from 'react';

export interface TranslateContextModel {
  config: { locales: string[]; current: string; messages };
  changeLocale: (locale: string) => void;
}
export const TranslateContext = createContext<TranslateContextModel>(undefined);

export const TranslateContextProvider = (props) => {
  const [config, setConfig] = useState({});

  useEffect(() => {
    setConfig(props.config);
  }, [props.config]);

  const changeLocale = (locale: string) => {
    setConfig({ ...config, current: locale });
  };

  return (
    <TranslateContext.Provider value={{ config, changeLocale }}>
      {props.children}
    </TranslateContext.Provider>
  );
};

export default TranslateContextProvider;
