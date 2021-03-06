import { useEffect, useState } from 'react';
import cem from './cem';

export interface ProviderProps<T> {
  children: any;
  value: T;
}

export interface ConsumerProps<T> {
  children: (params: T) => React.ReactElement;
}

export default function createContext<T>(defaultValue: T, contextName: string, noSymbol: boolean = false) {
  const id = noSymbol ? contextName : Symbol.for(contextName);

  if (defaultValue) {
    cem.shareData({
      [id]: defaultValue,
    }, { silent: true });
  }

  return {
    Provider: (props: ProviderProps<T>) => {
      const { children, value } = props;

      cem.shareData({
        [id]: value,
      });

      return children;
    },
    Consumer: (props: ConsumerProps<T>) => {
      const { children } = props;

      const [config, setConfig] = useState<T>();

      useEffect(() => {
        cem.trackShareDataOnce(id, (cfg: T) => {
          setConfig(cfg);
        });
      }, []);

      return children(config);
    },
    consume: (callback: (config: T) => any) => {
      cem.trackShareDataOnce(id, (cfg: T) => {
        callback(cfg);
      });
    },
  };
}
