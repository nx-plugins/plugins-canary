import React, { useContext, useEffect, useState } from 'react';
import { TranslateContext } from '../data-access/translateContext';
import { translator } from '../utils/translator';
import { getTranslatableContent, getMessageById } from '@nx-plugins/i18n-core';

export interface PluralProps {
  value: string;
  count: number;
  zero?: string;
  one?: string;
  two?: string;
  other?: string;
  children: any;
}

export function Plural(props: PluralProps) {
  const { config } = useContext(TranslateContext);
  const [slot, setSlot] = useState();

  useEffect(() => {
    let { id } = getTranslatableContent(props.value);
    const message = getMessageById(id, config);
    let target;
    if (
      message.hasOwnProperty('type') &&
      message.type === 'Plural'
    ) {
      switch (props.count) {
        case 0:
          target = message.target.hasOwnProperty('zero')
            ? message.target.zero
            : 'Not found';
          break;
        case 1:
          target = message.target.hasOwnProperty('one')
            ? message.target.one
            : 'Not found';
          break;
        case 2:
          target = message.target.hasOwnProperty('two')
            ? message.target.two
            : 'Not found';
          break;
        default:
          target = message.target.hasOwnProperty('other')
            ? message.target.other
            : 'Not found';
          break;
      }
    } else {
      target = 'Invalid Message';
    }
    translator(target, setSlot);
  }, [props, config]);

  return <>{slot}</>;
}

export default Plural;
