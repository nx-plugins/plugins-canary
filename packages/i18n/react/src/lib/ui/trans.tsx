import React, { useContext, useEffect, useState } from 'react';
import { TranslateContext } from '../data-access/translateContext';
import { translator } from '../utils/translator';
import { getTranslatableContent, getMessageById } from '@nx-plugins/i18n-core';

export function TransUnit(props: any) {
  const [slot, setSlot] = useState(props.children);
  const { config } = useContext(TranslateContext);

  useEffect(() => {
    let { id } = getTranslatableContent(props.value);
    const message = getMessageById(id, config);
    let target: string;
    if (message.hasOwnProperty('type') && message.type === 'TransUnit') {
      target = message.hasOwnProperty('target') ? message.target : message;
    } else {
      target = 'Invalid Message';
    }
    translator(target, setSlot);
  }, [config]);

  return <>{slot}</>;
}

export default TransUnit;
